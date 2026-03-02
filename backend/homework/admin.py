from django.contrib import admin
from homework.models import HomeworkOrder, ResponseBid, OrderDispute, OrderReview, DisputeMessage

@admin.register(HomeworkOrder)
class HomeworkOrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'subject', 'price', 'status', 'author', 'executor')
    list_filter = ('status', 'subject')
    search_fields = ('id', 'name', 'description')

@admin.register(ResponseBid)
class ResponseBidAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'author', 'price', 'status')
    list_filter = ('status',)
    search_fields = ('id', 'order__name', 'author__username')

@admin.register(OrderReview)
class OrderReviewAdmin(admin.ModelAdmin):
    list_display = ('order', 'author', 'grade', 'review_type')
    list_filter = ('review_type', 'grade')

@admin.register(OrderDispute)
class OrderDisputeAdmin(admin.ModelAdmin):
    list_display = ('id', 'order__id', 'status', 'author', 'opponent')
    list_filter = ('status',)
    search_fields = ('order__name',)

@admin.register(DisputeMessage)
class DisputeMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'dispute__id', 'author', 'type', 'text_preview')                
    list_filter = ('type',)
    search_fields = ('description', 'author__username')                

    def text_preview(self, obj):
        return obj.description[:50]
    text_preview.short_description = 'Текст'