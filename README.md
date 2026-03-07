# GrowTive

AI 기반 개인 성장 플랫폼

GrowTive는 개인의 **재무 관리, 지식 관리, 커뮤니케이션**을 하나의 플랫폼에서 관리할 수 있도록 설계된 웹 애플리케이션입니다.

---

## Features

- 💰 Money Dashboard
- 📊 Financial Snapshot System
- 📁 Template-based Finance Structure
- 🔗 Sankey Salary Flow Visualization
- 💬 WebSocket Chat (GrowTalk)

---

## Tech Stack

### Backend
- Spring Boot
- MyBatis
- MariaDB

### Frontend
- Vanilla JS SPA
- Axios
- Chart.js

---

## Architecture
Page → Axios → Spring Controller → Service → MyBatis → MariaDB


---

## Project Structure

````
growtive
├─ src
│ └─ main
│ ├─ java
│ │ └─ com
│ │ └─ growtive
│ │ ├─ auth
│ │ ├─ money
│ │ ├─ chat
│ │ └─ common
│ │
│ ├─ resources
│ │ ├─ mappers
│ │ ├─ static
│ │ │ ├─ app
│ │ │ │ ├─ pages
│ │ │ │ ├─ store
│ │ │ │ └─ ui
│ │ │ └─ assets
│ │ │ ├─ css
│ │ │ └─ js
│ │ │
│ │ └─ application.yml
│ │
│ └─ webapp
│
├─ gradle
├─ build.gradle
└─ settings.gradle
````

---

## Future Plans

- AI 기반 문서 분석 (DocuMind)
- 투자 관리 시스템
- 개인 지식 관리 시스템
- AI 기반 Q&A 기능

---

## Commit Convention

This project follows the Conventional Commit format.

Examples:
````
feat: add login API
feat: implement financial snapshot
fix: login session bug
refactor: auth service
docs: update README
````

Types:

| Type | Description |
|-----|-------------|
| feat | 새로운 기능 |
| fix | 버그 수정 |
| refactor | 코드 구조 개선 |
| docs | 문서 수정 |
| style | 코드 스타일 변경 |
| chore | 빌드/설정 변경 |

---
## Screenshot

![GrowTive Demo](docs/demo1.gif)