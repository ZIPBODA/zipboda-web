# 집보다(Zipboda) 디자인 시스템 — Figma node-id 레퍼런스

## 1. 문서 정보

| 항목 | 내용 |
|------|------|
| 문서명 | 집보다 디자인 시스템 — Figma node-id 레퍼런스 |
| 버전 | v2.2.0 |
| 작성일 | 2026-07-28 |
| 기반 문서 | Figma(Zipboda, fileKey `eQbErccR3ilS8Ri6EKBBD0`), ZIPBODA_디자인시스템_추가본.md(병합), .claude/rules/figma-implementation-rule.md |

### 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| v1.x | 2026-07-28 | 박지훈 | node-id 목록 정리(색상 swatch·타이포·상태·컴포넌트 20:x 등) |
| v2.0.0 | 2026-07-28 | Claude | MCP 연동 개편 — 사용법·호출 예시·빠른 색인 추가, 각 node-id의 **실측값(HEX·타이포·상태색·간격·버튼/컴포넌트 스펙)**을 Figma MCP로 추출해 반영, 코드 매핑 가이드 추가 |
| v2.1.0 | 2026-07-28 | Claude | 추가본 병합 — Admin Status 색(96:59~94)·Radius 6/10/18·Admin 타이포(Compact 13/2XSmall 11/ExtraBold)·Admin 컴포넌트 8종(StatusIndicator/Breadcrumb/Pagination/Sidebar/Dropdown/Table/Chart) MCP 실측 반영 |
| v2.2.0 | 2026-07-28 | Claude | 추가본 병합 2 — System/Purple(111:83~93)·Code/Syntax Highlight(111:101~126)·Radius 3px(111:131) 추가 |

---

## 2. MCP 연동 사용법

> 이 문서는 **Figma node-id ↔ 값 ↔ 코드 매핑**의 단일 참조원이다. 구현 시 `.claude/rules/figma-implementation-rule.md`(디자인 이탈·임의 판단 금지)를 반드시 함께 따른다.

- **fileKey**: `eQbErccR3ilS8Ri6EKBBD0`
- **node-id 포맷**: URL `node-id=9-94` → MCP 호출은 **`9:94`** (하이픈→콜론).

```
# 값·구조 조회 (색/타이포/컴포넌트 스펙)
mcp__figma__get_figma_data(fileKey="eQbErccR3ilS8Ri6EKBBD0", nodeId="20:77")

# 아이콘·이미지 자산 추출 (스크린샷 크롭 금지)
mcp__figma__download_figma_images(fileKey="eQbErccR3ilS8Ri6EKBBD0", nodes=[{"nodeId":"9:315", ...}])
```

- 아래 값은 **v2.0.0 스냅샷**이다. 구현 직전 해당 node-id로 재조회해 최신값을 확인한다(디자인이 최신 진실원).
- 이 파일은 **zipboda-web/docs에서 대표 관리**(app/admin은 `../zipboda-web/docs/` 참조).

### 빠른 node-id 색인

| 영역 | node | 영역 | node | 컴포넌트 | node |
|------|------|------|------|----------|------|
| Brand/Primary | `9:43` | Spacing | `9:458` | Button set | `5:150` |
| Secondary/Blue | `9:71` | Radius | `9:499` | Chip | `20:77` |
| System/Status | `9:94` | Elevation | `9:789` | Tab | `20:90` |
| Neutral/Grayscale | `9:127` | Icons | `9:315` | Checkbox | `20:96` |
| Neutral/Light | `9:169` | Header(page) | `72:34` | Input/Text | `20:113` |
| Background | `9:197` | BottomNav(page) | `9:648` | SearchBar | `20:126` |
| Typography | `9:231`~`9:307` | Footer(page) | `9:679` | Badge | `20:136` |
| 상태(청약/배송/D-Day) | `9:412`/`9:430`/`9:442` | Grid D/M | `9:814`/`9:820` | Card/Product·Listing | `20:183`/`20:193` |

**Admin 추가(추가본):** Admin Status `96:59` · Admin 타이포 `96:113`~`96:140` · StatusIndicator `96:288` · Breadcrumb `96:292` · Pagination `96:296` · Sidebar/Item `96:300` · Dropdown `96:304` · Table(DataRow/Container) `96:315`/`96:319` · Chart `96:326`
**추가본 2:** System/Purple `111:83` · Code/Syntax `111:101`~`111:126` · Radius 3px `111:131`

---

## 3. Colors

> 색상은 디자인 토큰(`shared/config`)으로 매핑해 사용(하드코딩 금지 — D3). node = swatch 프레임 id.

### 3.1 Brand / Primary — group `9:43`
| 토큰 | HEX | 용도 | node |
|------|-----|------|------|
| Primary | `#FFBA17` | 메인 브랜드 | `9:46` |
| Primary Light | `#FFF8E7` | 배경 하이라이트 | `9:51` |
| Primary Muted | `#FFF3C4` | 뱃지/태그 배경 | `9:56` |
| Primary BG | `#FFFBF0` | 섹션 배경 | `9:61` |
| Primary Dark | `#92600A` | 강조 텍스트 | `9:66` |

### 3.2 Secondary / Blue — group `9:71`
| 토큰 | HEX | 용도 | node |
|------|-----|------|------|
| Blue | `#2B7FFF` | 링크·액센트 | `9:74` |
| Blue Dark | `#155DFC` | 링크 텍스트 | `9:79` |
| Blue Light | `#EFF6FF` | 정보 배경 | `9:84` |
| Blue BG | `#EDF5FF` | 정보 섹션 | `9:89` |

### 3.3 System / Status — group `9:94`
| 토큰 | HEX | 용도 | node |
|------|-----|------|------|
| Success | `#00BC7D` | 완료·성공 | `9:97` |
| Success BG | `#ECFDF5` | 성공 배경 | `9:102` |
| Error | `#FF6467` | 오류·마감임박 | `9:107` |
| Error BG | `#FFF3F0` | 오류 배경 | `9:112` |
| Warning | `#F59E0B` | 경고·주의 | `9:117` |
| Warning BG | `#FEF8ED` | 경고 배경 | `9:122` |

### 3.4 Neutral / Grayscale — group `9:127`
| 토큰 | HEX | 용도 | node |
|------|-----|------|------|
| Black | `#000000` | — | `9:130` |
| Gray 900 | `#101828` | 메인 헤딩 | `9:134` |
| Gray 850 | `#1A1A1A` | 기본/굵은 텍스트 | `9:139` |
| Gray 800 | `#1E2939` | 서브 헤딩 | `9:144` |
| Gray 700 | `#364153` | 부제목 | `9:149` |
| Gray 600 | `#4A5565` | 본문 텍스트 | `9:154` |
| Gray 500 | `#6A7282` | 보조 텍스트 | `9:159` |
| Gray 400 | `#99A1AF` | 비활성 텍스트 | `9:164` |

### 3.5 Neutral / Light — group `9:169`
| 토큰 | HEX | 용도 | node |
|------|-----|------|------|
| Gray 300 | `#D1D5DC` | 비활성 요소 | `9:172` |
| Gray 200 | `#E5E7EB` | 구분선 | `9:177` |
| Gray 100 | `#F3F4F6` | 배경·테두리 | `9:182` |
| Gray 50 | `#F9FAFB` | 연한 배경 | `9:187` |
| White | `#FFFFFF` | 기본 배경 | `9:192` |

### 3.6 Background — group `9:197`
| 토큰 | HEX | 용도 | node |
|------|-----|------|------|
| BG Primary | `#FFFFFF` | 기본 흰색 | `9:200` |
| BG Secondary | `#F9FAFB` | 섹션 분리 | `9:205` |
| BG Tertiary | `#F3F4F6` | 카드/입력 배경 | `9:210` |
| BG Dark | `#111111` | 다크 섹션/푸터 | `9:215` |
| BG Warm | `#FAFAF8` | 따뜻한 배경 | `9:220` |

### 3.7 System / Admin Status — group `96:59` (추가·Admin 전용)
> Admin 콘솔 전용 상태 팔레트. 사용자 서비스 §3.3(청약/커머스 상태)와 **별도**이며, Admin 화면(테이블·차트·알림)에서 사용. (툴킷형 tailwind 계열)

| 토큰 | HEX | 용도 | node |
|------|-----|------|------|
| Info | `#3B82F6` | 정보·안내 | `96:59` |
| Info BG | `#DBEAFE` | 정보 배경 | `96:64` |
| Success-Alt | `#10B981` | Admin 성공 | `96:69` |
| Success-Alt BG | `#D1FAE5` | Admin 성공 배경 | `96:74` |
| Error-Alt | `#EF4444` | Admin 오류 | `96:79` |
| Error-Alt BG | `#FEE2E2` | Admin 오류 배경 | `96:84` |
| Warning BG(밝음) | `#FEF3C7` | 경고 배경(Admin) | `96:89` |
| Surface | `#F4F6F8` | Admin 서피스(헤더/바) | `96:94` |

### 3.8 System / Purple — group `111:83` (추가)
> 보라색 배지/태그용.

| 토큰 | HEX | 용도 | node |
|------|-----|------|------|
| Purple | `#8B5CF6` | 보라색 배지 텍스트 | `111:83` |
| Purple BG | `#F5F3FF` | 보라색 배지 배경 | `111:88` |
| Purple Light | `#F3E8FF` | 보라색 연한 배경 | `111:93` |

### 3.9 Code / Syntax Highlight — group `111:101` (추가)
> 코드 블록·diff 하이라이트용(문서/가이드/변경 표시).

| 토큰 | HEX | 용도 | node |
|------|-----|------|------|
| Code BG | `#1E1E1E` | 코드 블록 배경 | `111:101` |
| Code Text | `#888888` | 코드 일반 텍스트 | `111:106` |
| Deleted Label | `#FF6B6B` | 삭제 라벨 | `111:111` |
| Deleted | `#E06C75` | 삭제 행 | `111:116` |
| Added Label | `#51CF66` | 추가 라벨 | `111:121` |
| Added | `#98C379` | 추가 행 | `111:126` |

---

## 4. Typography — Pretendard

> 기본 텍스트 색 `#1A1A1A`. `size/line-height`(px), ls=letter-spacing.

| 스타일 | size | weight | line-h | ls | node |
|--------|:----:|:------:|:------:|----|------|
| Display/Large | 48 | 800(Variable) | 56 | -1.5 | `9:231` |
| Display/Medium | 36 | 700 | 44 | -1 | `9:236` |
| Display/Small | 30 | 700 | 38 | -0.5 | `9:241` |
| Heading/H1 | 24 | 700 | 32 | -0.3 | `9:248` |
| Heading/H2 | 20 | 700 | 28 | -0.3 | `9:253` |
| Heading/H3 | 18 | 600 | 28 | -0.2 | `9:258` |
| Heading/H4 | 16 | 600 | 24 | — | `9:263` |
| Body/Large | 18 | 400 | 28 | — | `9:270` |
| Body/Medium | 16 | 400 | 24 | — | `9:275` |
| Body/Small | 14 | 400 | 20 | — | `9:280` |
| Body/XSmall | 12 | 400 | 16 | — | `9:285` |
| Caption/Regular | 10 | 400 | 15 | — | `9:292` |
| Caption/Bold | 10 | 700 | 15 | — | `9:297` |
| Label/Medium | 12 | 600 | 18 | — | `9:302` |
| Label/Small | 10 | 700 | 15 | +0.5 | `9:307` |

### 4.1 Admin 타이포 (추가) — 밀도 높은 관리자 화면용
| 스타일 | size | weight | line-h | node |
|--------|:----:|:------:|:------:|------|
| Compact/Regular | 13 | 400 | 20 | `96:113` |
| Compact/Medium | 13 | 500 | 20 | `96:118` |
| Compact/Bold | 13 | 700 | 20 | `96:123` |
| 2XSmall/Regular | 11 | 400 | 16 | `96:130` |
| 2XSmall/Bold | 11 | 700 | 16 | `96:135` |
| 2XSmall/ExtraBold | 11 | 800 | 16 | `96:140` |

> ExtraBold 변형(node 미지정): H1-ExtraBold(24/800) · H3-ExtraBold(18/800) · Caption/ExtraBold(10/800) · Display/XSmall(18/900).

---

## 5. Status Indicators

공통: dot 8×8 · radius 12 · padding 12/16 · gap 10 · 텍스트 Pretendard 600/12. 색 = `배경 / 텍스트(=dot)`.

### 5.1 청약 신청 상태 — `9:412`
| 라벨 | 배경 | 텍스트 | dot | node |
|------|------|--------|-----|------|
| 신청완료 | `#EFF6FF` | `#155DFC` | `#2B7FFF` | `9:413` |
| 관심등록 | `#FEF8ED` | `#92600A` | `#F59E0B` | `9:416` |
| 당첨 | `#ECFDF5` | `#065F46` | `#00BC7D` | `9:419` |
| 미당첨 | `#FFF3F0` | `#FF6467` | `#FF6467` | `9:422` |
| 저장됨 | `#F3F4F6` | `#6A7282` | `#99A1AF` | `9:425` |

### 5.2 배송 상태 — `9:430`
| 라벨 | 배경 | 텍스트 | dot | node |
|------|------|--------|-----|------|
| 준비중 | `#FEF8ED` | `#92600A` | `#F59E0B` | `9:431` |
| 배송중 | `#EFF6FF` | `#155DFC` | `#2B7FFF` | `9:434` |
| 배송완료 | `#ECFDF5` | `#065F46` | `#00BC7D` | `9:437` |

### 5.3 D-Day 뱃지 — `9:442`
| 라벨 | 배경 | 텍스트 | dot | node |
|------|------|--------|-----|------|
| D-3 마감임박 | `#FFF3F0` | `#FF6467` | `#FF6467` | `9:443` |
| D-10 | `#FEF8ED` | `#92600A` | `#F59E0B` | `9:446` |
| D-24 | `#F3F4F6` | `#6A7282` | `#99A1AF` | `9:449` |
| LIVE 진행중 | `#ECFDF5` | `#065F46` | `#00BC7D` | `9:452` |

---

## 6. Spacing & Radius

### 6.1 Spacing — `9:458`
| 토큰 | 값 | 토큰 | 값 |
|------|----|------|----|
| Space-1 | 2 | Space-8 | 16 |
| Space-2 | 4 | Space-9 | 20 |
| Space-3 | 6 | Space-10 | 24 |
| Space-4 | 8 | Space-12 | 32 |
| Space-5 | 10 | Space-13 | 40 |
| Space-6 | 12 | Space-14 | 48 |
| | | Space-16 | 64 |

### 6.2 Radius — `9:499`
| 토큰 | 값 | 토큰 | 값 |
|------|----|------|----|
| XS | 2 | XL | 16 |
| SM | 4 | 2XL | 20 |
| MD | 8 | 3XL | 24 |
| LG | 12 | Full | 9999 |

**추가**: `3px`(Radius/3, XS·SM 사이, `111:131`) · `6px`(Radius/6, 다용도) · `10px`(Radius/10, 카드·컨테이너) · `18px`(Radius/18).

---

## 7. Elevation & Shadow — `9:789`
| 토큰 | box-shadow | 용도 |
|------|------------|------|
| Shadow/SM | `0 1px 4px rgba(0,0,0,.06)` | 카드 기본 |
| Shadow/MD | `0 4px 8px rgba(0,0,0,.10)` | 카드 호버 |
| Shadow/LG | `0 8px 16px -2px rgba(0,0,0,.12)` | 드롭다운·모달 |
| Shadow/XL | `0 12px 24px -4px rgba(0,0,0,.15)` | 팝업·시트 |

---

## 8. Icons — `9:315`
24×24, stroke `#6A7282`/`#99A1AF`. 자산은 `download_figma_images`로 SVG 추출. 17종:
`Search, Bell, Cart, User, Home, Shop, Community, Blueprint, MyPage, ChevronR, ArrowL, Heart, ChevronD, Cube, ZoomIn, ZoomOut, Rotate`

---

## 9. Navigation (페이지 프레임)

### 9.1 Desktop Header — `72:34` (1280×111)
- 흰색 bg · 하단 1px `#F3F4F6`. 로고 32×32 배지 `#FFBA17`(radius 12) + "집보다"(700/18 `#101828`).
- 검색 512×42, bg `#F9FAFB`, border `#E5E7EB`, radius 12, placeholder `#99A1AF`/14.
- CTA "지금 신청하기" bg `#FFBA17`, radius 12, padding 10/16, `#1A1A1A` 600/14.
- nav 링크 500/14 `#6A7282`, 활성=하단 2px `#FFBA17` + `#101828`.

### 9.2 Mobile Bottom Nav — `9:648` (375×66)
- 흰색 bg · 상단 1px border · 5탭 **홈/쇼핑/커뮤니티/쇼룸/마이페이지**, 아이콘 22×22, 라벨 500/9.5 `#99A1AF`.

### 9.3 Desktop Footer — `9:679` (1280×433, 다크 `#111111`)
- padding 64/24. 로고 + "집보다"(700/20 `#FFFFFF`). 소셜 36×36 `rgba(255,255,255,.1)` radius 12.
- 컬럼 헤더 700/12 UPPER ls 10% `#6A7282`, 링크 400/14 `#99A1AF`. `© 2025 집보다 Inc.` 400/12 `#4A5565`.

---

## 10. Grid & Layout
| | Desktop `9:814` | Mobile `9:820` |
|---|---|---|
| Container | 1280(max)/content 1232 | 375 (iPhone SE) |
| Columns/Gutter | 12 / 24 | — |
| Padding | 24 | 16 좌우 |
| Breakpoint | ≥1024 | — |
| Bottom Nav | — | 66 |

---

## 11. Button — set `5:150`
5 types × 2 sizes × 4 states. `shared/ui` Button으로 구현(D4). radius/padding 재현, 고정 height 임의 지정 금지(Figma `hug`).

| 타입/사이즈 | 배경(Default) | 텍스트 | radius | padding | font | node |
|-------------|--------------|--------|--------|---------|------|------|
| Primary / Large | `#FFBA17` | `#1A1A1A` | 16 | 14/32 | 700/14 | `23:15` |
| Primary / Small | `#FFBA17` | `#1A1A1A` | 12 | 8/16 | 700/12 | `23:33` |
| Secondary / Large | `#F3F4F6` | `#1A1A1A` | 12 | 12/24 | 600/14 | `23:53` |
| Outline / Large | 투명(border `#FFBA17` 1.5) | `#FFBA17` | 16 | 14/32 | 700/14 | `23:75` |
| Ghost / Large | 투명 | `#4A5565` | 8 | 8/12 | 500/14 | `23:97` |
| Dark / Large | `#1A1A1A` | `#FFFFFF` | 12 | 12/24 | 700/14 | `23:119` |

**State 색상**
- Primary: Hover `#E5A714` · Active `#CC9412` · Disabled `rgba(255,186,23,.4)`
- Secondary: Hover `#E5E7EB` · Active `#D1D5DC` · Disabled 텍스트 `#99A1AF`
- Outline: Hover bg `#FFFBF0` · Active bg `#FFF8E7`+`#E5A714` · Disabled `#D1D5DC`
- Ghost: Hover bg `#F9FAFB`+`#1A1A1A` · Active bg `#F3F4F6` · Disabled `#D1D5DC`
- Dark: Hover `#364153` · Active `#4A5565` · Disabled `rgba(26,26,26,.4)`

---

## 12. Components (`shared/ui`로 구현·재사용 — D4)

### Chip — `20:77` (set `20:78`)
pill radius 9999 · padding 6/12 · 10px. Active `#FFBA17`/`#1A1A1A`(700) · Default `#F3F4F6`/`#6A7282`(600) · DarkActive `#1A1A1A`/`#FFFFFF`(700) · Outline 투명/border `#E5E7EB`/`#4A5565`(500).

### Tab — `20:90` (set `20:91`)
padding 10/16 · 14px. Active 하단 2px `#FFBA17` + `#1A1A1A`(700) · Default `#99A1AF`(500).

### Checkbox — `20:96`
박스 24×24 radius 4. Unchecked bg `#FFFFFF` border 1.5 `#D1D5DA` · Checked bg `#FFBA17` ✓흰색 · Disabled bg `#F3F4F6` opacity .5. 라벨 `#364153`/13. (약관용 소형은 radius 3)

### Input / Text — `20:113` (set `20:117`)
320×44 · radius 8 · padding 12/16 · 14px. Default border `#E5E7EB` placeholder `#99A1AF` · Focused border `#FFBA17` · Filled `#1A1A1A` · Disabled bg `#F9FAFB` text `#D1D5DC`.

### SearchBar — `20:126`
width 320 · radius 12 · padding 10/16 · bg `#F3F4F6` · 아이콘 18×18 `#99A1AF` · placeholder `#99A1AF`/14.

### Badge — `20:136` (set `20:140`)
radius 8 · padding 4/8 · 700/10. Primary `#FFBA17`/`#1A1A1A` · Error `#FF6467`/白 · Success `#00BC7D`/白 · Info `#2B7FFF`/白 · Neutral `#F3F4F6`/`#6A7282` · Dark `#1A1A1A`/白.

### Icon/Star — `20:153` · Rating/Stars — `20:159`
Star 12×12 fill `#FFBA17`. Rating=별 5개 가로(gap 2) ≈ 68×12, `#FFBA17`.

### Avatar — `20:169`
40×40 원형(9999) bg `#F3F4F6`, 이니셜 `#6A7282` 700/14.

### Divider — `20:175`
320×1px, fill **`#F3F4F6`** (= Neutral Gray-100 / BG Tertiary). 디자인시스템(Figma actual) 기준으로 `#F3F4F6` 확정 — 구버전의 Gray-200(`#E5E7EB`) 표기는 폐기.

### Card / Product — `20:183`
width 160, gap 8. 이미지 h120 radius 12 bg `#F3F4F6`. 브랜드 `#99A1AF` 500/10 · 상품명 `#1A1A1A` 600/12 · 가격 `#101828` 700/14.

### Card / Listing — `20:193`
width 320 radius 16 bg `#FFFFFF` border `#F3F4F6`. 제목 `#1A1A1A` 700/14 · 위치 `#6A7282` 400/12 · D-day `#FF6467` 600/12.

### ListItem — `20:203`
width 320 padding 12/16 gap 8 row-center. 라벨 `#1A1A1A` 400/14 · 값 `#6A7282` 500/14.

### Navigation / MobileBottom — `20:213` (컴포넌트)
375 wide, padding 8/0, bg `#FFFFFF`, 상단 border `#F3F4F6`. 5탭 **홈/쇼핑/커뮤니티/쇼룸/마이페이지**(확정) 아이콘 22×22 + 라벨 9.5. Active `#FFBA17`(700) · Inactive `#99A1AF`(500).
> ✅ Figma 동기화 완료(2026-07-28): DS 컴포넌트 `20:213`의 4번째 탭이 **쇼룸**(NavItem `26:75` / 텍스트 `26:77`)으로 반영됨. 탭 node — 홈 `26:66` · 쇼핑 `26:69` · 커뮤니티 `26:72` · 쇼룸 `26:75` · 마이페이지 `26:78`. 문서·화면설계서·Figma 3자 일치.

### Navigation / DesktopHeader — `20:233` (컴포넌트)
1440 wide, padding 16/64, gap 32, bg `#FFFFFF`, 하단 border `#F3F4F6`. 로고 `#1A1A1A` 700/18 · NavLinks(청약/평면도/가구/커뮤니티/쇼룸) `#4A5565` 500/14 · Actions(검색/알림/장바구니) 아이콘 20×20 `#6A7282`.

> **헤더/네비 정의(피그마 기준):** §9(페이지 프레임 72:34/9:648/9:679)와 §12의 Navigation 컴포넌트(20:213/20:233)는 동일 UI의 **컴포넌트 정의 vs 페이지 인스턴스** 관계다. 구현 컴포넌트는 **§12(20:x)를 정본**으로 한다.
> - Desktop Header: **내부 요소 스펙은 컴포넌트 `20:233` 기준**. 단 `20:233`의 아트보드 폭 1440은 Figma 캔버스 폭일 뿐이며, **실제 컨테이너 폭은 Grid(§10, 데스크톱 max 1280)** 를 따른다(페이지 프레임 `72:34`가 1280로 표현). → 폭은 1280, 요소 스펙은 20:233.
> - Mobile Bottom Nav: 컴포넌트 `20:213`(폭 375) 기준.

### (Admin 전용) 관리자 콘솔 컴포넌트 — 추가본 병합
> `zipboda-admin`에서 사용. `shared/ui`(admin) 구현. 폰트 Pretendard(Figma raw는 Inter 표기 → Pretendard 매핑). 공통: border `#E5E7EB`, 텍스트 primary `#111827`·muted `#6B7280`·placeholder/disabled `#9CA3AF`.

- **StatusIndicator** — `96:288`(set `96:164`): dot 8×8 + 라벨(13/500 `#111827`), gap 6, padding 4/8. 5변형(dot색만): Success `#10B981` · Error `#EF4444` · Warning `#F59E0B` · Info `#3B82F6` · Default `#9CA3AF`.
- **Breadcrumb** — `96:292`(comp `96:165`): row gap 4. 링크 13/400 `#6B7280` · 구분자 `/` `#9CA3AF` · 현재 13/600 `#111827`. 예: "홈 / 청약 관리 / 공고 목록".
- **Pagination** — `96:296`(comp `96:171`): 바 padding 16, bg `#F4F6F8`, radius 8. 페이지 버튼 32×32 radius 6 · Active bg `#111827` 흰숫자 700 · 일반 투명 `#6B7280` 500. info 13/400 `#6B7280`.
- **Sidebar/Item** — `96:300`(set `96:200`, **다크 사이드바**): row gap 12, padding 12/16/12/20, icon 20×20. Default bg `#000000`/라벨 14/400 `#E5E7EB` · **Active bg `#2A2A2A`/라벨 14/700 `#FFBA17`** · Hover bg `#222222`.
- **Dropdown/Select** — `96:304`(set `96:217`): padding 10/12, radius 6, chevron 16 `#6B7280`. Default border 1px `#E5E7EB` · **Open border 1.5px `#3B82F6`(포커스)** · Placeholder 값 `#9CA3AF` · Disabled bg `#F3F4F6`.
- **Table/DataRow** — `96:315`(set `96:242`): 행 padding 14/16, 하단 divider 1px `#E5E7EB`, 셀 13/400 `#111827`. Default `#FFFFFF` · Hover `#F9FAFB` · Selected `#EFF6FF`.
- **Table/Container** — `96:319`(comp `96:243`): bg `#FFFFFF`, border 1px `#E5E7EB`, radius 10. Header bg `#F4F6F8`, 헤더 텍스트 12/700 `#6B7280`, padding 12/16. 고정폭 예: 날짜 90 · 금액 80.
- **Chart** — `96:326`(set `96:284`): 컨테이너 height 200, padding 16, radius 10, border `#E5E7EB`. title 14/600 `#111827`, chart-area bg `#F9FAFB` radius 8. 팔레트 `#3B82F6`·`#10B981`·`#F59E0B`·`#EF4444`. 변형 Bar/Donut/Line.

---

## 13. 코드 매핑 가이드
- **색/간격/radius/그림자/타이포** → `shared/config` 디자인 토큰으로 정의 후 참조(code-organization.md). 임의 hex/px 금지(D3).
- **컴포넌트**(Button/Chip/Tab/Checkbox/Input/SearchBar/Badge/Rating/Avatar/Divider/Card/ListItem/Nav) → `shared/ui`에 구현·재사용(D4). **Admin 전용**(StatusIndicator/Breadcrumb/Pagination/Sidebar/Dropdown/Table/Chart)은 `zipboda-admin`의 `shared/ui`.
- **토큰 패키지 반영**: Admin Status 색·Radius 6/10/18은 `@zipboda/tokens`에 추가 대상(현 tokens는 사용자 앰버 세트 기준). Admin 팔레트는 별도 그룹(admin-status)으로 분리 권장.
- 상태 뱃지(청약/배송/D-Day)는 §5 매핑을 그대로 쓰는 단일 컴포넌트 권장.
- 구현 시 출처 node-id 주석(D5). 예: `// figma 20:183 Card/Product`.
- 값 불일치·누락은 임의 결정 금지, 디자인시스템 문서(Figma actual) 기준으로 확정 후 반영(D6).
