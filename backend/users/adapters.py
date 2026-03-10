from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from .models import Client

class MyCustomAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        if sociallogin.is_existing:
            return
        
        email = sociallogin.user.email
        if email:
            try:
                user = Client.objects.get(email=email)

                sociallogin.connect(request, user)
            except Client.DoesNotExist:
                pass

    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)
        
        if not sociallogin.is_existing:
            saved_login = request.session.get('pending_login')
            saved_password = request.session.get('pending_password')

            if saved_login:
                user.username = saved_login
            if saved_password:
                user.set_password(saved_password)
            
            if saved_login or saved_password:
                request.session.pop('pending_login', None)
                request.session.pop('pending_password', None)

        return user