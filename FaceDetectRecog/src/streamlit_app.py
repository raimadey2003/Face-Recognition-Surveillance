# streamlit_app.py
import streamlit as st
import requests
from io import BytesIO

import os
# Safe retrieval of API base: prefer st.secrets, fallback to env var or hardcoded default.
def get_api_base():
    # 1) try st.secrets (wrap in try/except because parsing may raise if no secrets file)
    try:
        # Using dictionary access inside try to avoid StreamlitSecretNotFoundError
        if hasattr(st, "secrets"):
            val = None
            try:
                # try safe direct access (works when secrets.toml is present)
                val = st.secrets["API_BASE"]
            except Exception:
                # fallback: st.secrets might not behave like a mapping if no file present
                val = None
            if val:
                return val
    except Exception:
        pass

    # 2) try environment variable
    env_val = os.getenv("API_BASE")
    if env_val:
        return env_val

    # 3) final fallback default
    return "http://localhost:8000"

API_BASE = get_api_base()

st.set_page_config(page_title="Face Search UI", layout="centered")

st.title("Face Recognition Pipeline — Streamlit UI")

col1, col2 = st.columns(2)

with col1:
    st.header("Pipeline")
    if st.button("Start pipeline"):
        r = requests.post(f"{API_BASE}/pipeline/start")
        st.write(r.json())
    if st.button("Stop pipeline"):
        r = requests.post(f"{API_BASE}/pipeline/stop")
        st.write(r.json())
    if st.button("Status"):
        r = requests.get(f"{API_BASE}/pipeline/status")
        st.write(r.json())

with col2:
    st.header("Query / Search")
    uploaded = st.file_uploader("Upload query image", type=["jpg","jpeg","png"])
    topk = st.slider("Top-K matches", 1, 10, 5)
    if uploaded:
        st.image(uploaded, caption="Query image", use_column_width=True)

    if st.button("Search") and uploaded:
        with st.spinner("Uploading and searching..."):
            files = {"file": (uploaded.name, uploaded.getvalue(), uploaded.type)}
            resp = requests.post(f"{API_BASE}/query?topk={topk}", files=files, timeout=60)
            if resp.status_code == 200:
                content_type = resp.headers.get("content-type","")
                if "image" in content_type:
                    st.success("Search returned an image result")
                    st.image(resp.content, use_container_width=True)
                else:
                    st.write(resp.json())
            else:
                st.error(f"Search failed: {resp.status_code} {resp.text}")
