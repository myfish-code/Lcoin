from rest_framework import serializers
from homework.models import HomeworkOrder, OrderReview, ResponseBid, OrderDispute, DisputeMessage

class HomeworkOrderSerializer(serializers.ModelSerializer):
    bids_count = serializers.IntegerField(read_only=True)
    author = serializers.SerializerMethodField()
    executor = serializers.SerializerMethodField()
    reviews_data = serializers.SerializerMethodField()

    class Meta:
        model = HomeworkOrder
        fields = "__all__"

    def get_author(self, obj):
        return {
            "id": obj.author.id,
            "username": obj.author.username,
            "verification_status": obj.author.verification_status
        }
    
    def get_executor(self, obj):
        if not obj.executor:
            return None

        return {
            "id": obj.executor.id,
            "username": obj.executor.username
        }
    
    def get_reviews_data(self, obj):
        order = obj
        reviews = getattr(order, 'reviews', None)
        if not reviews:
            return None
        
        reviews_data = {
            "executor": None,
            "customer": None
        }

        
        for review in reviews.all():
            reviews_data[review.review_type] = OrderReviewSerializer(review).data
        
        return reviews_data

class ResponseBidSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    order = serializers.SerializerMethodField()

    class Meta:
        model = ResponseBid
        fields = "__all__"

    def get_author(self, obj):
        return {
            "id": obj.author.id,
            "username": obj.author.username,
            "verification_status": obj.author.verification_status
        }
    
    def get_order(self, obj):
        return {
            "id": obj.order.id,
            "status": obj.order.status,
            "name": obj.order.name
        }

class OrderReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderReview
        fields = "__all__"

class OrderDisputeSerializer(serializers.ModelSerializer):
    
    name = serializers.SerializerMethodField()
    order = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = OrderDispute
        fields = "__all__"
    
    def get_name(self, obj):
        return { 
            "author": obj.author.username,
            "opponent": obj.opponent.username
        }
    
    def get_order(self, obj):
        return {
            "id": obj.order.id,
            "name": obj.order.name,
        }
    
    def get_last_message(self, obj):
        last_message = obj.last_message

        if not last_message:
            return None
        
        return {
            "text": last_message.description,
            "created_at": last_message.created_at
        }
    
class DisputeMessageSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    text = serializers.CharField(source='description')
    class Meta:
        model = DisputeMessage
        fields = "__all__"

    def get_author(self, obj):
        author = obj.author
        return {
            "id": author.id,
            "name": author.username
        }