from django.urls import path
from apiv1 import views

app_name = 'apiv1'
urlpatterns = [
    path('chordprog/', views.ChordProgressionGenerateAPIView.as_view()),
]
