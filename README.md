# 네온 브레이커 (Neon Breaker)

## 📁 파일 구조
```
neon-breaker/
├── index.html          # 메인 게임
└── neon_admin.html     # 관리자 페이지 (이미지 업로드)
```

## 🖼️ 이미지 관리
이미지는 **Supabase Storage**에 저장됩니다.
관리자 페이지(neon_admin.html)에서 직접 업로드/삭제 가능!

### 버킷 구조
- `thumbs/` - 캐릭터 썸네일 (char_1.jpg, char_2.png ...)
- `secret/` - 스테이지 이미지 (r1_s1.jpg, r1_s2.mp4 ...)

## 🚀 배포
1. GitHub에 index.html, neon_admin.html 업로드
2. Vercel 연결 → 자동 배포

## ⚙️ Supabase 설정
1. Supabase에서 Storage 버킷 생성 필요:
   - `thumbs` (Public)
   - `secret` (Public)
