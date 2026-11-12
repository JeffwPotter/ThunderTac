"""Minimal independent reader for .wtr session files (used to verify the format)."""
import zipfile, json, struct, array
class Wtr:
    def __init__(self, path):
        z = zipfile.ZipFile(path)
        self.manifest = json.load(z.open('manifest.json')); self.players = json.load(z.open('players.json'))
        self.units = json.load(z.open('units.json')); self.events = json.load(z.open('events.json'))
        self.states = json.load(z.open('states.json')); self.results = json.load(z.open('results.json'))
        self.bin = z.read('tracks.bin')
    def col(self, unit, name):
        for c in unit['columns']:
            if c['name'] == name:
                code = {'u32': 'I', 'f32': 'f', 'u8': 'B'}[c['type']]
                a = array.array(code); size = a.itemsize * c['count']
                a.frombytes(self.bin[c['offset']:c['offset'] + size]); return a
        raise KeyError(name)
