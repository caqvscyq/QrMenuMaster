import { useState } from "react";
import { Mic } from "lucide-react";
import { useVoiceSearch } from "@/hooks/use-voice-search";
import { useToast } from "@/hooks/use-toast";
import { MenuItem } from "@shared/schema";

interface VoiceSearchProps {
  onSearchResult: (query: string, results: MenuItem[]) => void;
}

export function VoiceSearch({ onSearchResult }: VoiceSearchProps) {
  const { toast } = useToast();
  const { isRecording, startRecording, stopRecording, isSupported } = useVoiceSearch({
    onResult: (transcript) => {
      handleVoiceResult(transcript);
    },
    onError: (error) => {
      toast({
        title: "語音識別失敗",
        description: "請重試或檢查麥克風權限",
        variant: "destructive",
      });
      console.error("Voice recognition error:", error);
    },
  });

  const handleVoiceResult = async (query: string) => {
    try {
      const response = await fetch(`/api/menu/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Search failed");
      
      const results: MenuItem[] = await response.json();
      onSearchResult(query, results);
      
      toast({
        title: "語音搜尋完成",
        description: `搜尋 "${query}" 找到 ${results.length} 個結果`,
      });
    } catch (error) {
      toast({
        title: "搜尋失敗",
        description: "請稍後再試",
        variant: "destructive",
      });
    }
  };

  const handleVoiceSearch = () => {
    if (!isSupported) {
      toast({
        title: "不支援語音搜尋",
        description: "您的瀏覽器不支援語音搜尋功能",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <section className="max-w-md mx-auto px-4 py-4">
      <div className="bg-restaurant-surface rounded-2xl shadow-sm p-4 mb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleVoiceSearch}
            className="flex-1 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 text-center transition-all duration-300 hover:border-primary focus:border-primary focus:outline-none"
            disabled={!isSupported}
          >
            <Mic className={`text-2xl mb-2 mx-auto ${isRecording ? 'text-red-500 animate-pulse' : 'text-primary'}`} />
            <p className="text-restaurant-secondary font-medium">
              {isRecording ? "正在聆聽..." : "點擊語音搜尋餐點"}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {isRecording ? "請說出您要搜尋的餐點" : "說出您想要的餐點名稱"}
            </p>
          </button>
        </div>
      </div>
    </section>
  );
}
