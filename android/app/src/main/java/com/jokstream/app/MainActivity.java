package com.jokstream.app;

import android.app.Activity;
import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.graphics.Color;
import android.view.ViewGroup;
import android.widget.FrameLayout;

public class MainActivity extends Activity {
    private static final String START_URL = "https://jokstream1.netlify.app/";
    private WebView web;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(5,7,11));
        getWindow().setNavigationBarColor(Color.rgb(5,7,11));

        FrameLayout root = new FrameLayout(this);
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setLoadsImagesAutomatically(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, true);

        web.setBackgroundColor(Color.rgb(5,7,11));
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                String host = req.getUrl().getHost();
                return host != null && !host.endsWith("netlify.app") && !host.endsWith("abdonarjah.workers.dev");
            }
        });
        web.setWebChromeClient(new WebChromeClient());
        web.loadUrl(START_URL);
        setContentView(root);
    }

    @Override public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }
}
