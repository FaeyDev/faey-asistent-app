"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Image as ImageIcon,
  Upload,
  Bot,
  User,
  Plus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type GeneratedImage = {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: Date;
};

export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState("chat");
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Halo! Saya adalah AI Assistant Anda. Saya bisa membantu Anda dengan berbagai tugas seperti:\n\n💬 Menjawab pertanyaan\n🔨 Membantu coding\n📝 Menulis konten\n🎯 Menyelesaikan tugas\n\nApa yang bisa saya bantu hari ini?",
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [imagePrompt, setImagePrompt] = useState("");
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageQuestion, setImageQuestion] = useState("");
  const [isImageAnalyzing, setIsImageAnalyzing] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: chatMessages
            .slice(-10)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Maaf, terjadi kesalahan. Silakan coba lagi.",
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || isImageGenerating) return;

    setIsImageGenerating(true);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt }),
      });

      if (!response.ok) throw new Error("Failed to generate image");

      const data = await response.json();

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        prompt: imagePrompt,
        imageUrl: data.imageUrl,
        timestamp: new Date(),
      };

      setGeneratedImages((prev) => [newImage, ...prev]);
      setImagePrompt("");
    } catch (error) {
      console.error("Image generation error:", error);
      alert("Gagal mengenerate gambar. Silakan coba lagi.");
    } finally {
      setIsImageGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setImageAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!uploadedImage || !imageQuestion.trim() || isImageAnalyzing) return;

    setIsImageAnalyzing(true);

    try {
      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: uploadedImage,
          question: imageQuestion,
        }),
      });

      if (!response.ok) throw new Error("Failed to analyze image");

      const data = await response.json();
      setImageAnalysis(data.analysis);
    } catch (error) {
      console.error("Image analysis error:", error);
      setImageAnalysis(
        "Maaf, terjadi kesalahan saat menganalisis gambar. Silakan coba lagi."
      );
    } finally {
      setIsImageAnalyzing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (activeTab === "chat") {
        handleSendMessage();
      } else if (activeTab === "image-gen") {
        handleGenerateImage();
      } else if (activeTab === "image-analysis") {
        handleAnalyzeImage();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg">
                <img
                  src="/ai-avatar.jpg" // ← Masukkan file gambar Anda ke folder public/
                  alt="AI Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  Faey Assistant
                </h1>
                <p className="text-xs text-muted-foreground">
                  Powered by Advanced Zee
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="w-3 h-3" />
              Real-time AI
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px] mx-auto">
            <TabsTrigger value="chat" className="gap-2">
              <Bot className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="image-gen" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              Generate Image
            </TabsTrigger>
            <TabsTrigger value="image-analysis" className="gap-2">
              <Upload className="w-4 h-4" />
              Analyze Image
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <Card className="p-6">
              <div className="h-[500px] overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </p>
                      <p className="text-xs opacity-60 mt-2">
                        {message.timestamp.toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      </div>
                    )}
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4">
                      <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ketik pertanyaan atau tugas Anda di sini..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="min-h-[60px] resize-none"
                  disabled={isChatLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                >
                  {isChatLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Image Generation Tab */}
          <TabsContent value="image-gen" className="space-y-4">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Describe the image you want to create
                  </label>
                  <Textarea
                    placeholder="e.g., A futuristic city at sunset with flying cars and neon lights..."
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="min-h-[100px] resize-none"
                    disabled={isImageGenerating}
                  />
                </div>
                <Button
                  onClick={handleGenerateImage}
                  disabled={!imagePrompt.trim() || isImageGenerating}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                  size="lg"
                >
                  {isImageGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Generating Image...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5 mr-2" />
                      Generate Image
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {generatedImages.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Generated Images</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedImages.map((image) => (
                    <div key={image.id} className="space-y-2">
                      <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img
                          src={image.imageUrl}
                          alt={image.prompt}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {image.prompt}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {image.timestamp.toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Image Analysis Tab */}
          <TabsContent value="image-analysis" className="space-y-4">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Upload Image
                  </label>
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={() =>
                        document.getElementById("image-upload")?.click()
                      }
                      variant="outline"
                      className="flex-1"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Choose Image
                    </Button>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  {uploadedImage && (
                    <div className="mt-4 max-w-md">
                      <img
                        src={uploadedImage}
                        alt="Uploaded"
                        className="w-full h-auto rounded-lg border"
                      />
                      <Button
                        onClick={() => {
                          setUploadedImage(null);
                          setImageAnalysis(null);
                        }}
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Ask about this image
                  </label>
                  <Textarea
                    placeholder="e.g., What objects do you see in this image?"
                    value={imageQuestion}
                    onChange={(e) => setImageQuestion(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="min-h-[80px] resize-none"
                    disabled={!uploadedImage || isImageAnalyzing}
                  />
                </div>

                <Button
                  onClick={handleAnalyzeImage}
                  disabled={
                    !uploadedImage || !imageQuestion.trim() || isImageAnalyzing
                  }
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                  size="lg"
                >
                  {isImageAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Analyze Image
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {imageAnalysis && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                  Analysis Result
                </h3>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {imageAnalysis}
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer with Author */}
      <footer className="mt-auto border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                ZD
              </div>
              <div>
                <p className="text-sm font-semibold">
                  Created by Zee Developer
                </p>
                <p className="text-xs text-muted-foreground">
                  Full Stack Engineer
                </p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-muted-foreground">
                © 2025 Faey Assistant. Built with Next.js
              </p>
              <div className="flex items-center gap-2 justify-center md:justify-end mt-1">
                <Badge variant="outline" className="text-xs">
                  Production Ready
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Enterprise Grade
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
