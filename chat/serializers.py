from rest_framework import serializers
from chat.models import Message, Conversation
from homework.models import OrderReview

class ConversationSerializer(serializers.ModelSerializer):
    user1 = serializers.SerializerMethodField()
    user2 = serializers.SerializerMethodField()

    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ["id", "user1", "user2", "last_message"]

    def get_user1(self, obj):
        user1 = obj.user1
        return {
            "id": user1.id,
            "name": user1.username
        }
    
    def get_user2(self, obj):
        user2 = obj.user2
        return {
            "id": user2.id,
            "name": user2.username
        }
    
    def get_last_message(self, obj):
        if obj.last_message:
            last_message = obj.last_message
            return {
                "sender_id": last_message.sender.id,
                "text": last_message.text
            }
        return None

class MessageSerializer(serializers.ModelSerializer):
    order = serializers.SerializerMethodField()
    author = serializers.SerializerMethodField()
    review_data = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = "__all__"

    def get_author(self, obj):
        author = obj.sender
        return {
            "id": author.id,
            "name": author.username
        }
    def get_order(self, obj):
        if obj.order:
            dispute = getattr(obj.order, 'dispute', None)
            order = obj.order
            return {
                "id": order.id,
                "finalPrice": order.final_price,
                "finalDays": order.final_days,
                "disputeId": dispute.id if dispute else None,
                "expectedFinish": order.expected_finish_at
            }

        return None
    
    def get_review_data(self, obj):
        if not obj.order:
            return None

        request = self.context.get('request')
        if not request or not request.user:
            return None
        
        reviews = obj.order.reviews.all()
        
        res = {"my_review": None, "partner_review": None}

        for review in reviews:
            if review.author.id == request.user.id:
                res["my_review"] = {"grade": review.grade, "text": review.text}
            else:
                res["partner_review"] = {"grade": review.grade, "text": review.text}
            
        return res

        
