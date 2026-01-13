from rest_framework import serializers
from chat.models import Message, Conversation
from homework.models import OrderReview

class ConversationSerializer(serializers.ModelSerializer):
    user1_name = serializers.SerializerMethodField()
    user2_name = serializers.SerializerMethodField()

    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ["id", "user1_name", "user2_name", "last_message"]

    def get_user1_name(self, obj):
        return obj.user1.username

    def get_user2_name(self, obj):
        return obj.user2.username
    
    def get_last_message(self, obj):
        if obj.last_message:
            return obj.last_message.text
        
        return None

class MessageSerializer(serializers.ModelSerializer):
    order = serializers.SerializerMethodField()
    review_data = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = "__all__"

    def get_order(self, obj):
        if obj.order:
            dispute = getattr(obj.order, 'dispute', None)
            return {
                "id": obj.order.id,
                "finalPrice": obj.order.final_price,
                "finalDays": obj.order.final_days,
                "disputeId": dispute.id if dispute else None
            }

        return None
    
    def get_review_data(self, obj):
        if not obj.order:
            return None

        request = self.context.get('request')
        if not request or not request.user:
            return None
        
        reviews = OrderReview.objects.filter(order=obj.order)
        
        res = {"sender_review": None, "receiver_review": None}

        for review in reviews:
            if review.author.id == request.user.id:
                res["my_review"] = {"grade": review.grade, "text": review.text}
            else:
                res["partner_review"] = {"grade": review.grade, "text": review.text}
            
        return res