# Generated by Django 3.1.7 on 2021-04-02 15:34

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0004_auto_20210401_1539'),
    ]

    operations = [
        migrations.AddField(
            model_name='comment',
            name='commented_tweet',
            field=models.ForeignKey(default='', on_delete=django.db.models.deletion.PROTECT, related_name='commented_tweet', to='network.tweet'),
            preserve_default=False,
        ),
    ]
