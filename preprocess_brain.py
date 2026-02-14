"""
Decimate Colin27 brain mesh + subcortical structures for web rendering.
Outputs a JavaScript file with combined hemisphere data and subcortical meshes.
"""
import numpy as np
import json
import os

SURF_DIR = 'docs/colin27/webapp/surf'
SUB_DIR = 'docs/colin27/webapp/subcortical'
OUT_FILE = 'brain_data.js'
CELL_SIZE = 2.8  # mm - grid cell size for cortex decimation
SUB_CELL_SIZE = 1.8  # mm - lighter decimation for subcortical

# Subcortical structures to include (skip cerebellum - too large)
SUBCORTICAL = [
    'Left-Hippocampus', 'Right-Hippocampus',
    'Left-Amygdala', 'Right-Amygdala',
    'Left-Thalamus-Proper', 'Right-Thalamus-Proper',
    'Left-Caudate', 'Right-Caudate',
    'Left-Putamen', 'Right-Putamen',
    'Left-Pallidum', 'Right-Pallidum',
    'Brain-Stem',
]

def load_hemisphere(hemi):
    verts = np.loadtxt(f'{SURF_DIR}/{hemi}.verts.pial.txt').reshape(-1, 3)
    faces = np.loadtxt(f'{SURF_DIR}/{hemi}.faces.pial.txt', dtype=int).reshape(-1, 3)
    curv_file = f'{SURF_DIR}/{hemi}.curv.txt'
    curv = np.loadtxt(curv_file) if os.path.exists(curv_file) else np.zeros(len(verts))
    return verts, faces, curv

def load_subcortical(name):
    verts = np.loadtxt(f'{SUB_DIR}/{name}_verts.txt').reshape(-1, 3)
    faces = np.loadtxt(f'{SUB_DIR}/{name}_faces.txt', dtype=int).reshape(-1, 3)
    return verts, faces

def decimate(verts, faces, curv, cell_size):
    cells = np.floor(verts / cell_size).astype(int)
    cell_map = {}
    old_to_new = np.full(len(verts), -1, dtype=int)
    new_verts = []
    new_curv = []

    for i in range(len(verts)):
        key = (cells[i, 0], cells[i, 1], cells[i, 2])
        center = (cells[i].astype(float) + 0.5) * cell_size
        dist = np.sum((verts[i] - center) ** 2)

        if key not in cell_map:
            new_idx = len(new_verts)
            cell_map[key] = (new_idx, dist, i)
            new_verts.append(verts[i])
            new_curv.append(curv[i] if i < len(curv) else 0)
            old_to_new[i] = new_idx
        else:
            existing_idx, existing_dist, _ = cell_map[key]
            old_to_new[i] = existing_idx
            if dist < existing_dist:
                cell_map[key] = (existing_idx, dist, i)
                new_verts[existing_idx] = verts[i]
                new_curv[existing_idx] = curv[i] if i < len(curv) else 0

    new_faces = []
    seen = set()
    for f in faces:
        nf = (old_to_new[f[0]], old_to_new[f[1]], old_to_new[f[2]])
        if nf[0] == nf[1] or nf[1] == nf[2] or nf[0] == nf[2]:
            continue
        key = tuple(sorted(nf))
        if key in seen:
            continue
        seen.add(key)
        new_faces.append(nf)

    return np.array(new_verts), np.array(new_faces), np.array(new_curv)

def decimate_mesh(verts, faces, cell_size):
    """Decimate a mesh without curvature data."""
    curv = np.zeros(len(verts))
    dv, df, _ = decimate(verts, faces, curv, cell_size)
    return dv, df

def main():
    print("Loading left hemisphere...")
    lh_v, lh_f, lh_c = load_hemisphere('lh')
    print(f"  LH: {len(lh_v)} verts, {len(lh_f)} faces")

    print("Loading right hemisphere...")
    rh_v, rh_f, rh_c = load_hemisphere('rh')
    print(f"  RH: {len(rh_v)} verts, {len(rh_f)} faces")

    print(f"\nDecimating cortex with cell_size={CELL_SIZE}mm...")
    lh_dv, lh_df, lh_dc = decimate(lh_v, lh_f, lh_c, CELL_SIZE)
    print(f"  LH decimated: {len(lh_dv)} verts, {len(lh_df)} faces")

    rh_dv, rh_df, rh_dc = decimate(rh_v, rh_f, rh_c, CELL_SIZE)
    print(f"  RH decimated: {len(rh_dv)} verts, {len(rh_df)} faces")

    # Combine hemispheres
    n_lh = len(lh_dv)
    all_verts = np.vstack([lh_dv, rh_dv])
    all_faces = np.vstack([lh_df, rh_df + n_lh])
    all_curv = np.concatenate([lh_dc, rh_dc])

    # Get cortex bounds for normalization (apply to subcortical too)
    all_raw_verts = all_verts.copy()

    # Load subcortical structures
    print(f"\nLoading subcortical structures (cell_size={SUB_CELL_SIZE}mm)...")
    sub_data = {}
    sub_raw_verts = []
    for name in SUBCORTICAL:
        vpath = f'{SUB_DIR}/{name}_verts.txt'
        fpath = f'{SUB_DIR}/{name}_faces.txt'
        if not os.path.exists(vpath):
            print(f"  SKIP {name} (not found)")
            continue
        sv, sf = load_subcortical(name)
        dv, df = decimate_mesh(sv, sf, SUB_CELL_SIZE)
        sub_data[name] = (dv, df)
        sub_raw_verts.append(dv)
        print(f"  {name}: {len(sv)} -> {len(dv)} verts, {len(sf)} -> {len(df)} faces")

    # Normalize using cortex + subcortical combined bounds
    combined_for_bounds = np.vstack([all_raw_verts] + sub_raw_verts)
    center = (combined_for_bounds.max(axis=0) + combined_for_bounds.min(axis=0)) / 2
    max_extent = np.abs(combined_for_bounds - center).max()
    scale = 1.5 / max_extent

    # Apply normalization to cortex
    all_verts = (all_verts - center) * scale

    # Apply normalization to subcortical and build output
    sub_output = []
    for name in SUBCORTICAL:
        if name not in sub_data:
            continue
        sv, sf = sub_data[name]
        sv_norm = (sv - center) * scale
        sub_output.append({
            'name': name,
            'v': np.round(sv_norm, 4).flatten().tolist(),
            'f': sf.flatten().tolist()
        })

    print(f"\nCortex: {len(all_verts)} verts, {len(all_faces)} faces")
    print(f"  Vertex range: [{all_verts.min():.2f}, {all_verts.max():.2f}]")

    total_sub_v = sum(len(s['v'])//3 for s in sub_output)
    total_sub_f = sum(len(s['f'])//3 for s in sub_output)
    print(f"Subcortical: {len(sub_output)} structures, {total_sub_v} total verts, {total_sub_f} total faces")

    # Build JS output
    verts_list = np.round(all_verts, 4).flatten().tolist()
    faces_list = all_faces.flatten().tolist()
    curv_list = np.round(all_curv, 3).tolist()

    data = {
        'v': verts_list,
        'f': faces_list,
        'c': curv_list,
        'sub': [{
            'n': s['name'],
            'v': s['v'],
            'f': s['f']
        } for s in sub_output]
    }

    js = f"window.BRAIN={json.dumps(data, separators=(',', ':'))};"

    with open(OUT_FILE, 'w') as f:
        f.write(js)

    file_size = os.path.getsize(OUT_FILE)
    print(f"\nOutput: {OUT_FILE} ({file_size / 1024:.0f} KB)")
    print("Done!")

if __name__ == '__main__':
    main()
