from django.contrib import admin
from .models import User, Tweet, Comment, Following

# Register your models here.

admin.site.register(User)
admin.site.register(Tweet)
admin.site.register(Comment)
admin.site.register(Following)
