from config import COLORS

def to_color(code, color):
    r,g,b = (int(code[i*2+1:i*2+3],16) for i in range(3))
    return (color, {'r': r, 'g': g, 'b': b})

d = dict(to_color(code,color) for code, color in COLORS)

import json
print(json.dumps(d,ensure_ascii=False))
