from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from users.models import Client, FeedBack

@admin.register(Client)
class CustomClientAdmin(UserAdmin):
    list_display = ('username', 'email', 'verification_photo', 'verification_status', 'is_staff')

    list_filter = ('verification_status', 'is_staff', 'is_active', 'language')
    search_fields = ('username', 'email')

    fieldsets = UserAdmin.fieldsets + (
        ('Специфичные поля клиента', {
            'fields': (
                'coins', 
                'language', 
                'customer_rating', 
                'executor_rating', 
                'verification_status', 
                'verification_photo', 
                'verification_rejected_reason'
            ),
        }),
    )
    
@admin.register(FeedBack)
class FeedBackAdmin(admin.ModelAdmin):
    list_display = ('author', 'text', 'created_at')

    search_fields = ('author__username', 'text')
    list_filter = ("created_at",)
