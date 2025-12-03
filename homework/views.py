

import re
from django.shortcuts import render, redirect, get_object_or_404
from django.utils import timezone
from datetime import timedelta
from chat.models import Conversation, Message
from homework.models import HomeworkOrder, ResponseBid
from django.http import HttpResponseForbidden
from django.db.models import Q
# Create your views here.

def search_view(request):
    orders = HomeworkOrder.objects.all()
    subjects = ["math", "phys", "eng", "chym" ]

    query = request.GET.get('query', '')
    subject = request.GET.get('subject', '')
    
    if query:
        orders = orders.filter(Q(name__icontains=query) | Q(description__icontains=query))
    if subject:
        orders = orders.filter(subject=subject)

    
    return render(request,'homework/search.html', {
        'orders': orders,
        'subjects': subjects
        })


def orders_view(request):

    error_message = None
    user = request.user

    if request.method == "POST":

        
        
        name = request.POST.get("name")
        description = request.POST.get("description")
        price = request.POST.get("price")
        deadline_time = request.POST.get("deadline_time")
        subject = request.POST.get("subject")

        if int(price) > user.coins:
            error_message = "Недостаточно монет для создания заказа!"
        else:
            
            deadline_time = timezone.now() + timedelta(days=int(deadline_time))
            HomeworkOrder.objects.create(
                name=name,
                description=description,
                price=price,
                deadline_time=deadline_time,
                subject=subject,
                author=request.user
            )

            user.coins -= int(price)
            user.save()



    orders = HomeworkOrder.objects.filter(author=request.user)

    context = {
        'orders': orders,
        'error_message': error_message,
        'coins': user.coins
    }
    return render(request, 'homework/orders.html', context)


def order_delete_view(request, order_id):
    user = request.user

    order = get_object_or_404(HomeworkOrder, id=order_id, author=user)

    user.coins += int(order.price)

    order.delete()
    user.save()

    return redirect('homework:orders')

def order_detail_view(request, order_id):
    order = get_object_or_404(HomeworkOrder, id=order_id)
    bids = ResponseBid.objects.filter(order=order)
    user_has_bid = bids.filter(author=request.user).exists()
    print(user_has_bid)
    context = {
        'order':order,
        'bids':bids,
        'user_has_bid': user_has_bid
    }   

    return render(request,'homework/order_detail.html', context)

def create_bid(request, order_id):
    if request.method == "POST":
        check_order_status = HomeworkOrder.objects.filter(id=order_id).first()

        if check_order_status.status != "open":
            return redirect("homework:order_detail", order_id=order_id)
        
        order = get_object_or_404(HomeworkOrder, id=order_id)

        check_bid_exist = ResponseBid.objects.filter(order=order, author=request.user).first()

        if check_bid_exist:
            return redirect("homework:order_detail", order_id=order_id)

        description = request.POST.get("description")
        price = int(request.POST.get("price"))
        days_to_complete = int(request.POST.get("days_to_complete"))
        order = get_object_or_404(HomeworkOrder, id=order_id)

        ResponseBid.objects.create(
            description=description,
            author=request.user,
            price=price,
            order=order,
            days_to_complete=days_to_complete
        )



    return redirect("homework:order_detail", order_id=order_id)

def bids_view(request):
    
    bids = ResponseBid.objects.filter(author=request.user)

    return render(request, 'homework/bids.html', {'bids': bids})

def assign_executor_view(request, bid_id):
    user_bid = get_object_or_404(ResponseBid, id=bid_id)

    if user_bid.order.author != request.user:
        return HttpResponseForbidden("У вас  нет права отправлять офер")

    user1, user2 = user_bid.author, user_bid.order.author

    if user1.id > user2.id:
        user1, user2 = user2, user1

    chat = Conversation.objects.filter(user1=user1, user2=user2).first()

    if not chat:
        chat = Conversation.objects.create(user1=user1, user2=user2)
    
    message = Message.objects.create(
        chat=chat,
        sender=request.user,
        text=f"Вы получили офер на выполнение задания: '{user_bid.order.name}'. Примите или отклоните.",
        message_type='offer',
        order=user_bid.order
    )

    chat.last_message = message
    chat.save()

    return redirect("chat:chat_detail",chat_id=chat.id)