CITIES = {
    "Meerut": (28.9845, 77.7064),
    "Delhi": (28.6139, 77.2090),
    "Noida": (28.5355, 77.3910),
    "Gurugram": (28.4595, 77.0266),
    "Ghaziabad": (28.6692, 77.4538),
    "Lucknow": (26.8467, 80.9462),
    "Agra": (27.1767, 78.0081),
    "Jaipur": (26.9124, 75.7873),
}

def nearest_city(lat, lon):
    return min(CITIES, key=lambda c: (CITIES[c][0] - lat) ** 2 + (CITIES[c][1] - lon) ** 2)