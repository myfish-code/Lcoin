from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Q
from django.http import HttpResponseForbidden
from chat.models import Conversation, Message
from homework.models import ResponseBid
from users.models import Client
# Create your views here.

def list_chats_view(request):
    chats = Conversation.objects.filter(Q(user1=request.user) | Q(user2=request.user))
                                        
    return render(request, 'chat/list_chats.html', {'chats':chats})

def create_chat(request, user_id):
    if request.user.id == user_id:
        return redirect('chat:list_chats')
    
    user1 = request.user
    user2 = Client.objects.get(id=user_id)
    
    if user1.id > user2.id:
        user1,user2 = user2, user1

    chat = Conversation.objects.filter(user1=user1, user2=user2).first()

    if chat:
        return redirect("chat:chat_detail", chat_id=chat.id)

    chat = Conversation.objects.create(user1=user1, user2=user2)

    return redirect("chat:chat_detail",chat_id=chat.id)


def chat_view(request, chat_id):
    

    chat = get_object_or_404(Conversation, id=chat_id)

    if request.user not in [chat.user1, chat.user2]:
        return HttpResponseForbidden("У вас нет права на эту переписку") 

    if request.method == "POST":
        text = request.POST.get("text")

        if text:

            last_message = Message.objects.create(
                chat=chat,
                sender=request.user,
                text=text
            )
            chat.last_message = last_message
            chat.save()

            

    messages = Message.objects.filter(chat=chat).order_by("created_at") #или просто chat.message.all() потому что related_name="message"
    #или просто messages = chat.messages.all().order_by("created_at")

    return render(request, 'chat/chat_detail.html', {
        'chat': chat,
        'messages': messages
    })

def handle_offer_view(request, message_id):
    message = get_object_or_404(Message, id=message_id)

    if message.sender == request.user:
        return HttpResponseForbidden("Вы не можете принимать или отклонять свой же офер")
    
    if request.user not in (message.chat.user1, message.chat.user2):
        return HttpResponseForbidden("У вас нет доступа к этому чату")
        
    
    order = message.order
    
    if request.method == "POST":
        answer = request.POST.get("action")
        
        bid = ResponseBid.objects.filter(order=order, author=request.user).first()

        if answer == "accept":
            order.executor = request.user
            order.status = 'in_progress'
            order.save()

            message.message_type = 'offer_accepted'
            message.save()

            bid.status = 'acepted'
            bid.save()

        else:
            message.message_type = 'offer_declined'
            message.save()
    
    return redirect("chat:chat_detail", chat_id=message.chat.id)