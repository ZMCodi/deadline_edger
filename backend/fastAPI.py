from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware # To allow frontend to connect


# Download the required libraries using: pip install fastapi "uvicorn[standard]"
# To run, type the following command into the terminal:
# python -m uvicorn main:app --reload



app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # very permissive setting that tells browsers to allow requests from any domain. convenient for development but should be restricted to the actual frontend's domain in a production environment for security.
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

#pydantic models define the structure of the JSON that the API will return.

class Template(BaseModel):
    id: int # the node address
    todos: List[str]
    lat: float
    status: str

#api endpoints

@app.get("/api/nodes/latest", response_model=Template)
def get_latest_nodes(
    site: Optional[str] = None, 
    status: Optional[int] = None,
    shift: Optional[str] = None,
    crew: Optional[List[str]] = Query(None)  # query to properly receive a list from the url
):
    
    return {}
