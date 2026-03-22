-- 1. Users 테이블 (고객/전문가 구분)
CREATE TABLE IF NOT EXISTS Users (
    user_id SERIAL PRIMARY KEY,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('CUSTOMER', 'EXPERT')),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Estimates 테이블 (견적 요청서)
CREATE TABLE IF NOT EXISTS Estimates (
    estimate_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    expert_id INTEGER REFERENCES Users(user_id) ON DELETE SET NULL,
    service_type VARCHAR(100) NOT NULL,
    details TEXT,
    price DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Emergency_Requests 테이블 (실시간 긴급 요청)
CREATE TABLE IF NOT EXISTS Emergency_Requests (
    request_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    location VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ASSIGNED', 'RESOLVED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 빠른 조회를 위한 인덱스 생성
CREATE INDEX idx_emergency_status_created ON Emergency_Requests(status, created_at DESC);
CREATE INDEX idx_emergency_location ON Emergency_Requests(location);

-- 샘플 데이터 삽입
-- 유저 5명 (고객 3명, 전문가 2명)
INSERT INTO Users (user_type, name, email, phone_number) VALUES
('CUSTOMER', '김고객', 'customer1@example.com', '010-1111-1111'),
('CUSTOMER', '이고객', 'customer2@example.com', '010-2222-2222'),
('CUSTOMER', '박고객', 'customer3@example.com', '010-3333-3333'),
('EXPERT', '최전문', 'expert1@example.com', '010-4444-4444'),
('EXPERT', '정전문', 'expert2@example.com', '010-5555-5555');

-- 실시간 긴급 요청 샘플 데이터 10건 (AI Studio 샘플용)
INSERT INTO Emergency_Requests (customer_id, location, description, status) VALUES
(1, '서울시 강남구', '안방 누수 발생, 긴급 수리 필요', 'ACTIVE'),
(2, '서울시 서초구', '현관문 도어락 고장, 외출 불가', 'ACTIVE'),
(3, '경기도 성남시', '보일러 작동 불량 (에러코드 E01)', 'ACTIVE'),
(1, '서울시 송파구', '하수구 역류 흔적 발견', 'ASSIGNED'),
(2, '서울시 마포구', '전기 차단기가 계속 내려감', 'ACTIVE'),
(3, '경기도 수원시', '창문 유리가 깨짐, 빠른 조치 요망', 'RESOLVED'),
(1, '서울시 강동구', '에어컨 냉매 누출 의심', 'ACTIVE'),
(2, '서울시 관악구', '천장 조명 떨어짐, 전선 노출', 'CANCELLED'),
(3, '경기도 용인시', '수도꼭지 파손으로 물이 멈추지 않음', 'ACTIVE'),
(1, '서울시 동작구', '베란다 배관 동파', 'ACTIVE');
