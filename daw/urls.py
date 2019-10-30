from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('daw/start/', views.daw_start, name='daw_start'),
    path('daw/new/', views.daw_new, name='daw_new'),
    path('daw/<int:pk>/', views.daw_edit, name='daw_edit'),
]
