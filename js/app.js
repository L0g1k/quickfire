// Generated by CoffeeScript 1.3.3
(function(){$(function(){$($("#hero li")[0]).addClass("selected");$($("#hero li a")[0]).addClass("selected");return $("#hero li a").click(function(){var e,t,n;n=$("#hero li").index($(this).parent());$("#hero li").removeClass("selected");$(this).parent().addClass("selected");$("#hero .slide").removeClass("before after selected");t=$("#hero .slide").slice(0,n);t.addClass("before");$($("#hero li")[n]).addClass("selected");e=$("#hero .slide").slice(n+1);e.addClass("after");$("#hero .indicator").css("top",$(this).parent().position().top);return!1})})}).call(this);