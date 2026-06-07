import numpy as np
import cv2

def polygon_area(points):
    """
    Calculate area of a polygon using the Shoelace formula.
    points: [N, 2] array of (x, y) coordinates.
    """
    if len(points) < 3:
        return 0.0
    x = points[:, 0]
    y = points[:, 1]
    return 0.5 * np.abs(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1)))

def calculate_surface_degradation(masks, package_width, package_height):
    """
    Calculates the total degraded surface area percentage.
    masks: List of polygon points [N, 2] in pixel coordinates.
    """
    total_area = package_width * package_height
    if total_area == 0:
        return 0.0
        
    defect_area = 0.0
    # Create an empty mask to union overlapping defects
    binary_mask = np.zeros((int(package_height), int(package_width)), dtype=np.uint8)
    
    for mask_points in masks:
        # Fill the polygon on the binary mask
        pts = np.array(mask_points, np.int32)
        pts = pts.reshape((-1, 1, 2))
        cv2.fillPoly(binary_mask, [pts], 255)
        
    # Count defect pixels
    defect_area = np.count_nonzero(binary_mask)
    ratio = defect_area / total_area
    return float(ratio)

def determine_severity(degradation_ratio):
    """
    Maps degradation ratio to severity level.
    """
    if degradation_ratio < 0.05:
        return "LOW"
    elif degradation_ratio < 0.15:
        return "MEDIUM"
    elif degradation_ratio < 0.30:
        return "HIGH"
    else:
        return "CRITICAL"
