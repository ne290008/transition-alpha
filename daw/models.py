import uuid
from django.contrib.auth import get_user_model
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone
from jsonfield import JSONField


class Project(models.Model):
    """プロジェクトモデル"""

    class Meta:
        db_table = 'project'
        ordering = ['created_at']
        verbose_name = verbose_name_plural = 'プロジェクト'
        unique_together = ('project_name', 'author')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,
                          verbose_name='ID')
    project_name = models.CharField(verbose_name='プロジェクト名', max_length=64)
    author = models.ForeignKey(get_user_model(), on_delete=models.CASCADE,
                               verbose_name='作成者')
    melody_data = JSONField(verbose_name='メロディデータ', null=True)
    artist = models.CharField(verbose_name='アーティスト', max_length=32)
    key = models.CharField(verbose_name='キー', max_length=8)
    rhythm_pattern = models.CharField(verbose_name='リズムパターン', max_length=1)
    chord_prog = models.CharField(verbose_name='コード進行', max_length=64)
    bpm = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(240)],
                              verbose_name='BPM')
    created_at = models.DateTimeField(verbose_name='作成日時', default=timezone.now)
    updated_at = models.DateTimeField(verbose_name='更新日時', blank=True, null=True)

    def update(self):
        self.updated_at = timezone.now()
        self.save()

    def __str__(self):
        return self.project_name
