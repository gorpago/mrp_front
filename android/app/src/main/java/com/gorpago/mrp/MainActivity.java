package com.gorpago.mrp;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 네이티브 메트로놈 플러그인 등록
        registerPlugin(MetronomePlugin.class);
    }
}
