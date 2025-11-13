from .models import Client
from django.shortcuts import render, redirect


from django.contrib.auth import login,authenticate, logout

# Create your views here.

def login_view(request):

    if request.user.is_authenticated:
        return redirect("users:profile")
    
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")


        user = authenticate(request, username=username, password=password)

        if user is not None:
            
            login(request, user)

            return redirect("users:profile")

        
        error = "Неверный логин или пароль"
        return render(request,'users/login.html', {"error": error})


    return render(request, 'users/login.html')

def register_view(request):

    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        password2 = request.POST.get("password2")

        email = request.POST.get("email")

        if password != password2:
            error = "Пароли не совпадают."
            return render(request, "users/register.html", {"error": error})
        
        if Client.objects.filter(username=username).exists():
            error = "Пользователь с таким именем уже существует."
            return render(request, "users/register.html", {"error": error})

        if Client.objects.filter(email=email).exists():
            error = "Пользователь с такой почтой уже существует"
            return render(request, "users/register.html", {"error":error})
        

        user = Client.objects.create_user(username=username, password=password, email=email)    
        

        login(request, user)

        return redirect("users:profile")

    return render(request, 'users/register.html')

def profile_view(request):
    
    if not request.user.is_authenticated:
        return redirect('users:login')
    
    
    profile = request.user 

    context = {
        "username": profile.username,
        "email": profile.email,
        "coins": profile.coins

    }

    return render(request, 'users/profile.html', context)

def log_out(request):
    logout(request)

    return redirect('home')

