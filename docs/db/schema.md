Last Updated: 2026-03
# GrowTive Database Schema

GrowTive는 다음 4개의 도메인으로 구성된다.

````
GrowTive
├── Money (재무 관리)
├── GrowTalk (채팅)
├── DocuMind (문서 AI)
├── Stock (주식 관리)
└── Workspace (협업)


````


---

# 1. USERS

사용자 기본 정보

| column | description |
|------|-------------|
| id | 사용자 PK |
| username | 로그인 ID |
| password | 비밀번호 |
| display_name | 표시 이름 |
| email | 이메일 |
| provider | OAuth 제공자 |
| provider_id | OAuth ID |
| created_at | 생성일 |
| updated_at | 수정일 |

---

# 2. MONEY DOMAIN

## financial_node_template

재무 항목 기본 템플릿

| column | description |
|------|-------------|
| id | 템플릿 ID |
| user_id | 사용자 |
| name | 항목 이름 |
| type | INCOME / EXPENSE / ASSET |
| default_monthly_amount | 기본 금액 |

---

## financial_node_snapshot

특정 월의 실제 재무 데이터

| column | description |
|------|-------------|
| id | snapshot ID |
| user_id | 사용자 |
| template_id | template 참조 |
| year | 연도 |
| month | 월 |
| name | 항목 이름 |
| type | INCOME / EXPENSE / ASSET |
| current_balance | 현재 잔액 |
| monthly_amount | 월 금액 |
| expected_annual_return | 기대 수익률 |
| created_at | 생성일 |

````
type 값

INCOME  : 수입 (월급 등)
EXPENSE : 지출 (월세, 식비 등)
ASSET   : 투자 / 저축
REMAIN  : 계산된 가용금 (DB 저장 X)
````

---

## flow_template

재무 항목 간 기본 흐름 정의

예
````
월급 → 월세
월급 → 식비
월급 → 투자
````


| column | description |
|------|-------------|
| id | PK |
| user_id | 사용자 |
| from_template_id | 시작 노드 |
| to_template_id | 도착 노드 |

---

## flow_snapshot

특정 월의 실제 자금 흐름

| column | description |
|------|-------------|
| id | PK |
| user_id | 사용자 |
| from_snapshot_id | 시작 노드 |
| to_snapshot_id | 도착 노드 |
| amount | 흐름 금액 |
| year | 연도 |
| month | 월 |
| created_at | 생성일 |

---

# Money 데이터 흐름 구조
````
financial_node_template
↓ (월 시작 시 복사)

financial_node_snapshot
↓ (flow_template 기반 생성)

flow_snapshot
↓
Sankey Chart
````
### Relationships (FK 관계)

financial_node_snapshot.template_id
→ financial_node_template.id

flow_snapshot.from_snapshot_id
→ financial_node_snapshot.id

flow_snapshot.to_snapshot_id
→ financial_node_snapshot.id

---

# 3. DOcumind DOMAIN

## document

업로드 문서

| column | description |
|------|-------------|
| id | PK |
| title | 문서 제목 |
| file_path | 파일 경로 |
| content | 문서 내용 |
| created_at | 생성일 |

---

## summary

AI 요약 결과

| column | description |
|------|-------------|
| id | PK |
| document_id | 문서 |
| summary_text | 요약 |
| created_at | 생성일 |

---

## qa_log

문서 질의응답 로그

| column | description |
|------|-------------|
| id | PK |
| document_id | 문서 |
| question | 질문 |
| answer | 답변 |
| created_at | 생성일 |

---

# 4. GROW TALK (CHAT)

## chat_room

채팅방

| column | description |
|------|-------------|
| room_id | PK |
| room_type | 개인 / 그룹 |
| title | 채팅방 이름 |
| created_by | 생성자 |

---

## chat_member

채팅방 참여자

| column | description |
|------|-------------|
| room_id | 채팅방 |
| user_id | 사용자 |

---

## chat_message

메시지

| column | description |
|------|-------------|
| msg_id | PK |
| room_id | 채팅방 |
| sender_id | 보낸 사용자 |
| content | 메시지 |
| created_at | 생성일 |

---

# 5. STOCK DOMAIN

## stock_master

주식 기본 정보

| column | description |
|------|-------------|
| id | PK |
| symbol | 종목 코드 |
| market | 시장 |
| name | 종목 이름 |

---

## stock_note

주식 메모

| column | description |
|------|-------------|
| id | PK |
| stock_id | 종목 |
| buy_price | 매수가 |
| sell_price | 매도가 |
| target_price | 목표가 |
| memo | 메모 |

---

# 6. WORKSPACE DOMAIN

## workspaces

워크스페이스

| column | description |
|------|-------------|
| id | PK |
| name | 이름 |
| owner_user_id | 관리자 |

---

## workspace_members

워크스페이스 사용자

| column | description |
|------|-------------|
| workspace_id | 워크스페이스 |
| user_id | 사용자 |
| role | 권한 |

---

# Sankey Chart 구조
````
financial_node_snapshot (노드)

↓

flow_snapshot (흐름)

↓

Chart.js Sankey
````
