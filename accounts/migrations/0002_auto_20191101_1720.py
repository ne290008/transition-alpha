# Generated by Django 2.2.6 on 2019-11-01 08:20

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='customuser',
            options={'verbose_name': 'ユーザー', 'verbose_name_plural': 'ユーザー'},
        ),
    ]