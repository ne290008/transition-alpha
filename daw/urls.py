from django.urls import path
from . import views

urlpatterns = [
    path('', views.list, name='list'),
    path('daw/start/', views.daw_start, name='daw_start'),
    path('daw/new/', views.daw_new, name='daw_new'),
    path('daw/<int:pk>/', views.daw_edit, name='daw_edit'),
    # テスト用
    path('daw/start/p', views.daw_start_p, name='daw_start_p'),
    path('daw/new/p', views.daw_new_p, name='daw_new_p'),
    path('daw/start/s', views.daw_start_s, name='daw_start_s'),
    path('daw/new/s', views.daw_new_s, name='daw_new_s'),
]
