from rest_framework import serializers

from daw.lib.suggester import generate_chord_prog
from daw.lib.keys import major_keys, minor_keys
from daw.lib.artists import artists

keys = major_keys + minor_keys

class ChordProgressionSerializer(serializers.Serializer):
    """コード進行を返すためのシリアライザ"""

    artist = serializers.ChoiceField(choices=artists)
    key = serializers.ChoiceField(choices=keys)
    #出⼒時に get_chord_progression() が呼ばれる
    chord_progression = serializers.SerializerMethodField()

    def get_chord_progression(self, obj):
        # とりあえずIのコードから始めるようにしている(第3引数)
        return generate_chord_prog(obj['artist'], obj['key'], obj['key'])
