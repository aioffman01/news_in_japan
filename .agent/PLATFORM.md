우리는 React(Frontend)와 FastAPI(Backend) 조합의 분리형 아키텍처 프로젝트를 새로 시작할 거야. 

기획, API 명세, 백엔드, 프론트엔드가 서로 완벽히 대칭되고 독립적으로 유지보수될 수 있도록 폴더 구조와 개발 규칙을 정의하니, 아래 가이드에 맞춰 프로젝트 초기화 세팅을 진행해 줘.



\### 1. 프로젝트 폴더 구조 생성 규칙

루트 디렉토리 아래에 다음 구조로 폴더와 기본 파일들을 생성해 줘.



/docs                      # 기획 및 OpenAPI 명세서 관리

├── features/              # 기획자의 기능 정의서 (.md)

└── openapi/               # 기능별로 분할된 OpenAPI 3.0 명세서

&#x20;   ├── main.yaml          # 분할된 명세서들을 조립하는 메인 파일

&#x20;   ├── paths/             # 도메인별 API 엔드포인트 정의 폴더

&#x20;   └── components/        # 도메인별 입출력 데이터 모델(Schema) 정의 폴더



/backend                   # Python FastAPI 백엔드

├── app/

│   ├── core/              # 공통 설정 (config.py, database.py)

│   ├── models/            # DB 테이블 정의 (SQLAlchemy)

│   ├── schemas/           # Pydantic 입출력 데이터 검증 모델

│   ├── crud/              # 테이블별 독립적 쿼리 클래스 (base.py 및 테이블별 파일)

│   └── api/v1/            # 엔드포인트 라우터 구조

└── sql/                   # 테이블 생성(schema.sql) 및 migrations/ 파일 관리



/frontend                  # React 프론트엔드

└── src/

&#x20;   ├── core/              # 공통 설정 (config, theme, utils)

&#x20;   ├── api/               # 백엔드 대칭 통신 레이어 (client.js 및 도메인별 파일)

&#x20;   ├── types/             # 백엔드 schemas 대칭 데이터 타입 정의

&#x20;   └── features/          # 도메인별 격리 공간 (components/, hooks/, Page.jsx)





\### 2. 개발 및 협업 가이드라인 규칙

앞으로 모든 기능 구현 시 아래 프로세스와 규칙을 강제해야 해.



1\. 단일 진실 공급원(Single Source of Truth): 모든 기능 개발의 시작은 `docs/` 내부의 기획 정의와 `openapi/` 명세서 작성이 선행되어야 함. 명세서에 정의되지 않은 API 개발은 금지함.

2\. 쿼리 캡슐화: 백엔드 DB 접근 시 라우터나 모델에 직접 SQL/ORM을 작성하지 않고, `app/crud/` 하위에 테이블별 독립 클래스(Class)를 만들어 메서드로만 접근해야 함.

3\. 프론트-백 대칭성: 새로운 도메인 기능(예: auth, items)이 추가될 때, 백엔드(`app/crud/`, `app/api/`)와 프론트엔드(`src/api/`, `src/features/`)에 동일한 도메인명으로 폴더 및 파일이 대칭되게 생성되어야 함.

4\. UI와 로직 분리: React 컴포넌트 내부에는 순수 UI 렌더링만 담당하고, API 통신 및 상태 제어 로직은 `features/\[도메인]/hooks/` 내부의 Custom Hook으로 완전히 격리해야 함.





\### 3. 지금 수행할 작업

\- 위 가이드라인에 맞게 `/docs`, `/backend`, `/frontend` 전체 디렉토리 트리 구조를 실제로 생성해 줘.

\- 백엔드의 `app/crud/base.py` 공통 부모 클래스 파일과 프론트엔드의 `src/api/client.js` 공통 Axios 설정 베이스 파일을 생성해 줘.

\- 세팅이 완료되면 구조 요약과 함께 다음 단계(기획 문서 작성)를 위해 어떤 준비가 되었는지 알려줘.

