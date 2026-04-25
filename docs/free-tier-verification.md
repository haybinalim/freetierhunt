# Free Tier Verification Checklist

Bu dokümanda tüm "free" iddiaların doğrulama durumu ve fallback planları kaydedilir.

## 🔴 Kritik Servisler (Doğrulanmalı)

### Groq (30 req/dk free)
- [ ] Son güncelleme tarihi: ____
- [ ] Test edildi: ____
- [ ] Limit değişikliği kontrolü (son 90 gün Reddit/HN): ____
- [ ] Fallback: OpenRouter → GPT-4o-mini
- [ ] Sonuç: ✅ Working / ❌ Changed / ❌ Removed

### OpenRouter (Llama 3.1 405B free)
- [ ] Son güncelleme tarihi: ____
- [ ] Test edildi: ____
- [ ] Capacity-based limit kontrolü: ____
- [ ] Fallback: Groq → GPT-4o-mini
- [ ] Sonuç: ✅ Working / ❌ Changed / ❌ Removed

### Oracle Always Free (4 CPU + 24GB RAM)
- [ ] VM oluşturuldu: ____
- [ ] 30 gün test edildi: ____
- [ ] Reclamation risk araştırması: ____
- [ ] Fallback: Railway ($5/ay) veya Fly.io
- [ ] Sonuç: ✅ Working / ⚠️ Risk / ❌ Reclaimed

### Vercel (100GB bandwidth)
- [ ] Limit kontrolü: ____
- [ ] 2024 değişiklik araştırması: ____
- [ ] Fallback: Cloudflare Pages
- [ ] Sonuç: ✅ Working / ❌ Changed

### Supabase (500MB + 50K MAU)
- [ ] Limit kontrolü: ____
- [ ] Pooler connection (port 6543) test edildi: ✅
- [ ] Fallback: Railway Postgres
- [ ] Sonuç: ✅ Working / ❌ Changed

### NVIDIA NIM (40 req/dk)
- [ ] Rate limit kontrolü: ____
- [ ] Model availability kontrolü: ____
- [ ] Fallback: Groq → OpenRouter
- [ ] Sonuç: ✅ Working / ❌ Changed

### Brave Search API
- [ ] Free tier limit kontrolü: ____
- [ ] Test edildi: ____
- [ ] Fallback: Tavily → Serper.dev
- [ ] Sonuç: ✅ Working / ❌ Changed

### Tavily API
- [ ] Free tier limit kontrolü: ____
- [ ] Test edildi: ____
- [ ] Fallback: Brave → Serper.dev
- [ ] Sonuç: ✅ Working / ❌ Changed

## 🟡 İkincil Servisler

### Resend (3K email/ay)
- [ ] Limit kontrolü: ✅
- [ ] Fallback: Mailgun free tier
- [ ] Sonuç: ✅ Working

### Upstash Redis (10K req/gün)
- [ ] BullMQ ile test edildi: ____
- [ ] Fallback: Oracle VM self-host Redis
- [ ] Sonuç: ✅ Working

### Sentry (5K errors/ay)
- [ ] Limit kontrolü: ✅
- [ ] Development'ta devre dışı bırakıldı: ____
- [ ] Sonuç: ✅ Working

## 🔧 Test Script'leri

### Groq Test
```bash
curl -X POST "https://api.groq.com/openai/v1/chat/completions" \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "llama-3.3-70b-versatile", "messages": [{"role": "user", "content": "Hello"}]}'
```

### Supabase Pooler Test
```bash
psql "postgresql://postgres:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres" \
  -c "SELECT 1;"
```

## 📊 Maliyet Hesabı Güncellemesi

| Servis | Planlanan | Gerçek | Fark |
|--------|-----------|--------|------|
| Groq | $0 | ____ | ____ |
| OpenRouter | $0 | ____ | ____ |
| Oracle | $0 | ____ | ____ |
| Vercel | $0 | ____ | ____ |
| Supabase | $0 | ____ | ____ |
| **Toplam** | **$0** | **____** | **____** |

## 🚨 Acil Aksiyonlar

Eğer bir servis değişirse:
1. Bu dokümanı güncelle
2. Fallback planı aktive et
3. Kullanıcıya bilgi ver (eğer etkiliyorsa)
4. Alternatif servis araştır

Son güncelleme: ____
