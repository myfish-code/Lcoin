from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from users.models import Client, FeedBack

@admin.register(Client)
class CustomClientAdmin(UserAdmin):
    list_display = ('id', 'username', 'email', 'verification_photo', 'verification_status', 'is_staff')

    ordering = ('-id',)

    list_filter = ('verification_status', 'is_staff', 'is_active', 'language')
    search_fields = ('username', 'email')

    fieldsets = UserAdmin.fieldsets + (
        ('Специфичные поля клиента', {
            'fields': (
                'id',
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

    readonly_fields = ('id',)
    
@admin.register(FeedBack)
class FeedBackAdmin(admin.ModelAdmin):
    list_display = ('author', 'text', 'created_at')

    search_fields = ('author__username', 'text')
    list_filter = ("created_at",)
