import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../css/PostPage.css";

const BoardPage = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState([]);

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력하세요.");
      return;
    }

    const newPost = {
      id: Date.now(), // 고유 ID
      title,
      content,
      author: "user123", // 임시 작성자
    };

    setPosts([newPost, ...posts]); // 새 게시글을 맨 위에 추가
    setTitle("");
    setContent("");
  };

  return (
    <div className="container">
      <h2>게시판</h2>

      {/* 게시글 작성 폼 */}
      <div className="write-box">
        <h3>게시글 작성</h3>
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="내용을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button onClick={handleSave}>저장</button>
      </div>

      <hr />

      {/* 게시글 목록 */}
      <div className="post-list">
        <h3>게시글 목록</h3>

        {posts.length === 0 ? (
          <p>작성된 게시글이 없습니다.</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="post-item">
              <h4>{post.title}</h4>
              <p>작성자: {post.author}</p>
              <Link to="/postdetailpage">
                <button>자세히 보기</button>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BoardPage;
