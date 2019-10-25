from rest_framework import status, views
from rest_framework.response import Response

from .serializers import ChordProgressionSerializer


class ChordProgressionGenerateAPIView(views.APIView):
    """コード進行を生成するためのAPIクラス"""

    def post(self, request, *args, **kwargs):
        """コード進行を生成するためのAPIに対応するハンドラメソッド"""

        # シリアライザオブジェクトを作成
        serializer = ChordProgressionSerializer(data=request.data)
        # バリデーションを実行
        serializer.is_valid(raise_exception=True)
        # レスポンスオブジェクトを作成して返す
        return Response(serializer.data, status.HTTP_201_CREATED)
