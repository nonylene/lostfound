import random
import time
import json


TYPES = ['スマートフォン','スマートフォン', 'スマートフォン', 'スマートフォン', 'スマートフォン',  'ケータイ']
COVERS = [True, False]
MAKERS = ['Company1', 'Company2', 'Company3', 'Company4']
POLICES = [
    "北警察署",
    "南警察署",
    "東警察署",
    "南警察署",
    "上警察署",
    "中警察署",
    "下警察署",
    "左警察署",
    "右警察署",
]


def rand_color():
    return {
        'r': random.randint(0, 255),
        'g': random.randint(0, 255),
        'b': random.randint(0, 255),
    }

LOC_START = [34.989181, 135.732393]
LOC_END = [35.051727, 135.792519]

def rand_loc():
    return {
        'lat': random.uniform(LOC_START[0], LOC_END[0]),
        'lng': random.uniform(LOC_START[1], LOC_END[1]),
    }

START = 1559314800000

datas = []

for i in range(30):
    mil = START + i * 24 * 60 * 60 * 1000
    for _ in range(15):
        datas.append({
            'type': random.choice(TYPES),
            'cover': random.choice(COVERS),
            'maker': random.choice(MAKERS),
            'color': rand_color(),
            'location': rand_loc(),
            'date': mil,
            'police': random.choice(POLICES),
        })

print(json.dumps(datas, ensure_ascii=False))
