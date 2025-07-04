<p align = "center" draggable=”false” ><img src="https://github.com/AI-Maker-Space/LLM-Dev-101/assets/37101144/d1343317-fa2f-41e1-8af1-1dbb18399719" 
     width="200px"
     height="auto"/>
</p>


## <h1 align="center" id="heading"> 👋 Welcome to the AI Engineer Challenge</h1>

## 🤖 Your First Vibe Coding LLM Application with PDF RAG

> If you need an introduction to `git`, or information on how to set up API keys for the tools we'll be using in this repository - check out our [Interactive Dev Environment for LLM Development](https://github.com/AI-Maker-Space/Interactive-Dev-Environment-for-AI-Engineers) which has everything you'd need to get started in this repository!

In this repository, we'll walk you through the steps to create a **PDF RAG (Retrieval-Augmented Generation) powered application** with a vibe-coded frontend! 

**🎯 What You'll Build:**
- Regular AI chat interface with OpenAI models
- **PDF upload and indexing system** 📄
- **RAG-based chat with your PDFs** 🧠
- Modern tabbed interface for seamless switching
- Real-time streaming responses

Are you ready? Let's get started!

## 🔧 Quick Start with UV

This project uses [UV](https://docs.astral.sh/uv/) for blazing-fast Python package and environment management!

```bash
# Install dependencies
uv sync

# Start the backend API
cd api && uv run uvicorn app:app --reload --port 8000

# In another terminal, start the frontend
cd frontend && npm install && npm run dev
```

## ✨ Features

### 🗣️ Regular Chat Mode
- Stream chat responses from OpenAI models
- Support for GPT-4, GPT-3.5 Turbo, and more
- Custom system prompts for developer control

### 📚 PDF Chat Mode  
- **Upload any PDF** and chat with its content
- **Automatic text extraction** using PyPDF2
- **Smart chunking** for optimal context retrieval
- **Vector database** powered by our custom aimakerspace library
- **RAG responses** that cite relevant PDF sections

### 🎨 Beautiful UI
- **Tabbed interface** for easy mode switching
- **Real-time upload progress** and status indicators
- **Streaming responses** with typing animations
- **Responsive design** that works on all devices

## 🛠️ Technical Architecture

### Backend (FastAPI)
- **`/api/chat`** - Regular OpenAI chat endpoint
- **`/api/upload-pdf`** - PDF upload and indexing
- **`/api/chat-pdf`** - RAG chat with uploaded PDF
- **`/api/pdf-status`** - Check PDF upload status

### PDF Processing Pipeline
1. **Upload** - Secure PDF file handling
2. **Extract** - Text extraction with PyPDF2
3. **Chunk** - Smart text splitting with overlap
4. **Embed** - Vector embeddings via OpenAI
5. **Index** - Store in vector database
6. **Retrieve** - Semantic search for relevant chunks
7. **Generate** - RAG responses with context

### Frontend (React + Vite)
- **Tabbed interface** for chat modes
- **File upload** with drag-and-drop support
- **Streaming chat** with real-time updates
- **Beautiful animations** and status indicators

<details>
  <summary>🖥️ Accessing "gpt-4.1-mini" (ChatGPT) like a developer</summary>

1. Head to [this notebook](https://colab.research.google.com/drive/1sT7rzY_Lb1_wS0ELI1JJfff0NUEcSD72?usp=sharing) and follow along with the instructions!

2. Complete the notebook and try out your own system/assistant messages!

That's it! Head to the next step and start building your application!

</details>


<details>
  <summary>🏗️ Forking & Cloning This Repository</summary>

1. Fork [this](https://github.com/AI-Maker-Space/The-AI-Engineer-Challenge) repo!

     ![image](https://i.imgur.com/bhjySNh.png)

1. Clone your newly created repo.

     ``` bash
     git clone git@github.com:<YOUR GITHUB USERNAME>/The-AI-Engineer-Challenge.git
     ```

2. Open the freshly cloned repository inside Cursor!

     ```bash
     cd The-AI-Engineering-Challenge
     cursor .
     ```

3. Check out the existing backend code found in `/api/app.py`

</details>

<details>
  <summary>🔥Setting Up for Vibe Coding Success </summary>

While it is a bit counter-intuitive to set things up before jumping into vibe-coding - it's important to remember that there exists a gradient betweeen AI-Assisted Development and Vibe-Coding. We're only reaching *slightly* into AI-Assisted Development for this challenge, but it's worth it!

1. Check out the rules in `.cursor/rules/` and add theme-ing information like colour schemes in `frontend-rule.mdc`! You can be as expressive as you'd like in these rules!
2. We're going to index some docs to make our application more likely to succeed. To do this - we're going to start with `CTRL+SHIFT+P` (or `CMD+SHIFT+P` on Mac) and we're going to type "custom doc" into the search bar. 

     ![image](https://i.imgur.com/ILx3hZu.png)
3. We're then going to copy and paste `https://nextjs.org/docs` into the prompt.

     ![image](https://i.imgur.com/psBjpQd.png)

4. We're then going to use the default configs to add these docs to our available and indexed documents.

     ![image](https://i.imgur.com/LULLeaF.png)

5. After that - you will do the same with Vercel's documentation. After which you should see:

     ![image](https://i.imgur.com/hjyXhhC.png) 

</details>

<details>
  <summary>😎 Vibe Coding a Front End for the FastAPI Backend</summary>

1. Use `Command-L` or `CTRL-L` to open the Cursor chat console. 

2. Set the chat settings to the following:

     ![image](https://i.imgur.com/LSgRSgF.png)

3. Ask Cursor to create a frontend for your application. Iterate as much as you like!

4. Run the frontend using the instructions Cursor provided. 

> NOTE: If you run into any errors, copy and paste them back into the Cursor chat window - and ask Cursor to fix them!

> NOTE: You have been provided with a backend in the `/api` folder - please ensure your Front End integrates with it!

</details>

<details>
  <summary>🚀 Deploying Your First LLM-powered Application with Vercel</summary>

1. Ensure you have signed into [Vercel](https://vercel.com/) with your GitHub account.

2. Ensure you have `npm` (this may have been installed in the previous vibe-coding step!) - if you need help with that, ask Cursor!

3. Run the command:

     ```bash
     npm install -g vercel
     ```

4. Run the command:

     ```bash
     vercel
     ```

5. Follow the in-terminal instructions. (Below is an example of what you will see!)

     ![image](https://i.imgur.com/D1iKGCq.png)

6. Once the build is completed - head to the provided link and try out your app!

> NOTE: Remember, if you run into any errors - ask Cursor to help you fix them!

</details>

### 🎉 Congratulations! 

You just deployed your first LLM-powered application! 🚀🚀🚀 Get on linkedin and post your results and experience! Make sure to tag us at @AIMakerspace!

Here's a template to get your post started!

```
🚀🎉 Exciting News! 🎉🚀

🏗️ Today, I'm thrilled to announce that I've successfully built and shipped my first-ever LLM using the powerful combination of , and the OpenAI API! 🖥️

Check it out 👇
[LINK TO APP]

A big shoutout to the @AI Makerspace for all making this possible. Couldn't have done it without the incredible community there. 🤗🙏

Looking forward to building with the community! 🙌✨ Here's to many more creations ahead! 🥂🎉

Who else is diving into the world of AI? Let's connect! 🌐💡

#FirstLLMApp 
```
