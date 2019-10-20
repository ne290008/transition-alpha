from django.urls import path
from . import views

urlpatterns = [
    path('list/', views.list, name='list'),
    path('daw/start/', views.daw_start, name='daw_start'),
    path('daw/new/', views.daw_new, name='daw_new'),
    path('daw/<int:pk>/', views.daw_edit, name='daw_edit'),
    # 開発用
    path('', views.root, name='root')
]
