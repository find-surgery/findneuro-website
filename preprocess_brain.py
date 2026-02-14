"""
Decimate Colin27 brain mesh for web rendering.
Outputs a JavaScript file with combined hemisphere data.
"""
import numpy as np
import json
import os

SURF_DIR = 'docs/colin27/webapp/surf'
OUT_FILE = 'brain_data.js'
CELL_SIZE = 2.8  # mm - grid cell size for decimation

def load_hemisphere(hemi):
    """Load vertices, faces, and curvature for one hemisphere."""
    verts = np.loadtxt(f'{SURF_DIR}/{hemi}.verts.pial.txt').reshape(-1, 3)
    faces = np.loadtxt(f'{SURF_DIR}/{hemi}.faces.pial.txt', dtype=int).reshape(-1, 3)
    curv_file = f'{SURF_DIR}/{hemi}.curv.txt'
    curv = np.loadtxt(curv_file) if os.path.exists(curv_file) else np.zeros(len(verts))
    return verts, faces, curv

def decimate(verts, faces, curv, cell_size):
    """Grid-based mesh decimation. Merges nearby vertices into grid cells."""
    # Assign each vertex to a grid cell
    cells = np.floor(verts / cell_size).astype(int)

    # For each cell, keep the vertex closest to cell center
    cell_center_offset = cell_size / 2.0
    cell_map = {}  # cell_key -> (new_index, best_distance)
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

    # Remap and filter faces
    new_faces = []
    seen = set()
    for f in faces:
        nf = (old_to_new[f[0]], old_to_new[f[1]], old_to_new[f[2]])
        # Skip degenerate faces
        if nf[0] == nf[1] or nf[1] == nf[2] or nf[0] == nf[2]:
            continue
        # Skip duplicate faces
        key = tuple(sorted(nf))
        if key in seen:
            continue
        seen.add(key)
        new_faces.append(nf)

    return np.array(new_verts), np.array(new_faces), np.array(new_curv)

def main():
    print("Loading left hemisphere...")
    lh_v, lh_f, lh_c = load_hemisphere('lh')
    print(f"  LH: {len(lh_v)} verts, {len(lh_f)} faces")

    print("Loading right hemisphere...")
    rh_v, rh_f, rh_c = load_hemisphere('rh')
    print(f"  RH: {len(rh_v)} verts, {len(rh_f)} faces")

    print(f"\nDecimating with cell_size={CELL_SIZE}mm...")
    lh_dv, lh_df, lh_dc = decimate(lh_v, lh_f, lh_c, CELL_SIZE)
    print(f"  LH decimated: {len(lh_dv)} verts, {len(lh_df)} faces")

    rh_dv, rh_df, rh_dc = decimate(rh_v, rh_f, rh_c, CELL_SIZE)
    print(f"  RH decimated: {len(rh_dv)} verts, {len(rh_df)} faces")

    # Combine hemispheres (offset RH face indices by LH vertex count)
    n_lh = len(lh_dv)
    all_verts = np.vstack([lh_dv, rh_dv])
    all_faces = np.vstack([lh_df, rh_df + n_lh])
    all_curv = np.concatenate([lh_dc, rh_dc])

    # Normalize coordinates: center and scale to fit in [-1.5, 1.5] range
    center = (all_verts.max(axis=0) + all_verts.min(axis=0)) / 2
    all_verts -= center
    max_extent = np.abs(all_verts).max()
    scale = 1.5 / max_extent
    all_verts *= scale

    print(f"\nCombined: {len(all_verts)} verts, {len(all_faces)} faces")
    print(f"  Vertex range: [{all_verts.min():.2f}, {all_verts.max():.2f}]")
    print(f"  Curvature range: [{all_curv.min():.4f}, {all_curv.max():.4f}]")
    print(f"  Non-zero curvature: {np.count_nonzero(all_curv)}")

    # Round for compactness
    verts_list = np.round(all_verts, 4).flatten().tolist()
    faces_list = all_faces.flatten().tolist()
    curv_list = np.round(all_curv, 3).tolist()

    # Write JS file
    js = f"window.BRAIN={{v:{json.dumps(verts_list)},f:{json.dumps(faces_list)},c:{json.dumps(curv_list)}}};"

    with open(OUT_FILE, 'w') as f:
        f.write(js)

    file_size = os.path.getsize(OUT_FILE)
    print(f"\nOutput: {OUT_FILE} ({file_size / 1024:.0f} KB)")
    print("Done!")

if __name__ == '__main__':
    main()
