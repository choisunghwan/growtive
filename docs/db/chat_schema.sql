CREATE TABLE CHAT_ROOM (
                           ROOM_ID    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                           ROOM_TYPE  VARCHAR(20) NOT NULL, -- DIRECT / GROUP
                           TITLE      VARCHAR(100),
                           CREATED_BY VARCHAR(50) NOT NULL,
                           CREATED_AT TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE CHAT_MEMBER (
                             ROOM_ID BIGINT NOT NULL,
                             USER_ID VARCHAR(50) NOT NULL,
                             PRIMARY KEY (ROOM_ID, USER_ID)
);

CREATE TABLE CHAT_MESSAGE (
                              MSG_ID     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                              ROOM_ID    BIGINT NOT NULL,
                              SENDER_ID  VARCHAR(50) NOT NULL,
                              CONTENT    VARCHAR(2000) NOT NULL,
                              CREATED_AT TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
