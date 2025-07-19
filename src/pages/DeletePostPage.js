import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const DeletePostPage = () => {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(null); // null: 아직 클릭 전

  const handleDelete = () => {
    const isAuthorized = true; // 실제 권한 검사 로직으로 교체

    if (isAuthorized) {
      setSuccess(true);
      alert("✅ 삭제되었습니다.");
    } else {
      setSuccess(false);
      alert("❌ 삭제할 권한이 없습니다.");
    }

    navigate("/boardpage");
  };

  return (
    <div className="container">
      <h2>게시글 삭제</h2>

      <p>작성자: user123</p>
      <p>삭제할 게시글 ID: 123</p>

      <button onClick={handleDelete}>삭제</button>

      {/* 이 부분은 클릭 결과와 관계없이 렌더링만 보여주고 있음 */}
      {success === true && (
        <div className="message success">✅ 삭제되었습니다.</div>
      )}
      {success === false && (
        <div className="message error">❌ 삭제할 권한이 없습니다.</div>
      )}
    </div>
  );
};

export default DeletePostPage;
