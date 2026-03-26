from django.db import models
from django.contrib.auth.models import User


class StyleSession(models.Model):
    """Stores each AI styling session for a user."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    photo = models.ImageField(upload_to='photos/', null=True, blank=True)
    occasion = models.CharField(max_length=100)
    gender = models.CharField(max_length=50)
    style_preference = models.CharField(max_length=100)
    skin_tone_type = models.CharField(max_length=100, blank=True)
    skin_tone_undertone = models.CharField(max_length=50, blank=True)
    result_json = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Style Session'
        verbose_name_plural = 'Style Sessions'

    def __str__(self):
        user_str = self.user.username if self.user else 'Guest'
        return f"{user_str} — {self.occasion} — {self.created_at.strftime('%d %b %Y')}"


class UserProfile(models.Model):
    """Extended profile for registered users."""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    gender = models.CharField(max_length=50, blank=True)
    style_preference = models.CharField(max_length=100, blank=True)
    skin_tone = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Profile: {self.user.username}"
