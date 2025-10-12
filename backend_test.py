#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Pleader AI
Tests all backend functionality according to test_result.md
"""

import requests
import json
import io
import os
from datetime import datetime
import time

# Configuration
BASE_URL = "https://pleader-complete.preview.emergentagent.com/api"
TEST_USER = {
    "name": "Test User",
    "email": "test@pleader.ai", 
    "password": "TestPass123"
}

class PleaderBackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.auth_token = None
        self.test_user_id = None
        self.test_chat_id = None
        self.test_document_id = None
        self.results = {
            "auth": {"passed": 0, "failed": 0, "errors": []},
            "documents": {"passed": 0, "failed": 0, "errors": []},
            "rag": {"passed": 0, "failed": 0, "errors": []},
            "chat": {"passed": 0, "failed": 0, "errors": []},
            "export": {"passed": 0, "failed": 0, "errors": []}
        }
    
    def log_result(self, category, test_name, success, error=None):
        """Log test result"""
        if success:
            self.results[category]["passed"] += 1
            print(f"✅ {test_name}")
        else:
            self.results[category]["failed"] += 1
            self.results[category]["errors"].append(f"{test_name}: {error}")
            print(f"❌ {test_name}: {error}")
    
    def test_auth_signup(self):
        """Test user signup"""
        try:
            response = self.session.post(
                f"{self.base_url}/auth/signup",
                json=TEST_USER,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "user" in data:
                    self.auth_token = data["token"]
                    self.test_user_id = data["user"]["id"]
                    self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                    self.log_result("auth", "Signup", True)
                    return True
                else:
                    self.log_result("auth", "Signup", False, "Missing token or user in response")
            elif response.status_code == 400 and "already registered" in response.text:
                # User already exists, try login instead
                return self.test_auth_login()
            else:
                self.log_result("auth", "Signup", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("auth", "Signup", False, str(e))
        return False
    
    def test_auth_login(self):
        """Test user login"""
        try:
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json={"email": TEST_USER["email"], "password": TEST_USER["password"]},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "user" in data:
                    self.auth_token = data["token"]
                    self.test_user_id = data["user"]["id"]
                    self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                    self.log_result("auth", "Login", True)
                    return True
                else:
                    self.log_result("auth", "Login", False, "Missing token or user in response")
            else:
                self.log_result("auth", "Login", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("auth", "Login", False, str(e))
        return False
    
    def test_auth_me(self):
        """Test get current user"""
        try:
            response = self.session.get(f"{self.base_url}/auth/me")
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "email" in data:
                    self.log_result("auth", "Get Me", True)
                    return True
                else:
                    self.log_result("auth", "Get Me", False, "Missing user data in response")
            else:
                self.log_result("auth", "Get Me", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("auth", "Get Me", False, str(e))
        return False
    
    def test_auth_logout(self):
        """Test user logout"""
        try:
            response = self.session.post(f"{self.base_url}/auth/logout")
            
            if response.status_code == 200:
                self.log_result("auth", "Logout", True)
                return True
            else:
                self.log_result("auth", "Logout", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("auth", "Logout", False, str(e))
        return False
    
    def create_test_document(self):
        """Create a test document for analysis"""
        legal_text = """
        LEASE AGREEMENT
        
        This Lease Agreement ("Agreement") is entered into on January 1, 2025, between John Smith ("Landlord") and Jane Doe ("Tenant").
        
        1. PROPERTY: The Landlord agrees to lease to the Tenant the property located at 123 Main Street, Mumbai, Maharashtra.
        
        2. TERM: The lease term shall be for 12 months, commencing on January 1, 2025, and ending on December 31, 2025.
        
        3. RENT: The monthly rent shall be Rs. 25,000, payable on the 1st day of each month.
        
        4. SECURITY DEPOSIT: Tenant shall pay a security deposit of Rs. 50,000 upon signing this agreement.
        
        5. MAINTENANCE: Tenant is responsible for minor repairs and maintenance of the property.
        
        6. TERMINATION: Either party may terminate this lease with 30 days written notice.
        
        This agreement is governed by the laws of Maharashtra, India.
        """
        
        # Create a text file in memory
        file_content = legal_text.encode('utf-8')
        return file_content, "test_lease_agreement.txt"
    
    def test_document_analyze(self):
        """Test document analysis endpoint"""
        try:
            file_content, filename = self.create_test_document()
            
            files = {
                'file': (filename, io.BytesIO(file_content), 'text/plain')
            }
            
            response = self.session.post(
                f"{self.base_url}/documents/analyze",
                files=files
            )
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "analysis" in data:
                    self.test_document_id = data["id"]
                    analysis = data["analysis"]
                    if "extracted_text" in analysis and "full_analysis" in analysis:
                        self.log_result("documents", "Document Analysis", True)
                        return True
                    else:
                        self.log_result("documents", "Document Analysis", False, "Missing analysis components")
                else:
                    self.log_result("documents", "Document Analysis", False, "Missing id or analysis in response")
            else:
                self.log_result("documents", "Document Analysis", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("documents", "Document Analysis", False, str(e))
        return False
    
    def test_rag_query(self):
        """Test RAG query endpoint"""
        try:
            # Wait a moment for document indexing
            time.sleep(2)
            
            query_data = {
                "query": "What is the monthly rent mentioned in the lease agreement?",
                "top_k": 3,
                "use_rerank": True
            }
            
            response = self.session.post(
                f"{self.base_url}/rag/query",
                json=query_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "answer" in data and "sources" in data:
                    self.log_result("rag", "RAG Query", True)
                    return True
                else:
                    self.log_result("rag", "RAG Query", False, "Missing answer or sources in response")
            else:
                self.log_result("rag", "RAG Query", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("rag", "RAG Query", False, str(e))
        return False
    
    def test_rag_stats(self):
        """Test RAG stats endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/rag/stats")
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("rag", "RAG Stats", True)
                return True
            else:
                self.log_result("rag", "RAG Stats", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("rag", "RAG Stats", False, str(e))
        return False
    
    def test_chat_send(self):
        """Test sending a chat message"""
        try:
            message_data = {
                "message": "What are the key legal considerations when drafting a lease agreement in India?"
            }
            
            response = self.session.post(
                f"{self.base_url}/chat/send",
                json=message_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "chat_id" in data and "ai_message" in data:
                    self.test_chat_id = data["chat_id"]
                    self.log_result("chat", "Send Message", True)
                    return True
                else:
                    self.log_result("chat", "Send Message", False, "Missing chat_id or ai_message in response")
            else:
                self.log_result("chat", "Send Message", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("chat", "Send Message", False, str(e))
        return False
    
    def test_chat_history(self):
        """Test getting chat history"""
        try:
            response = self.session.get(f"{self.base_url}/chat/history")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("chat", "Chat History", True)
                    return True
                else:
                    self.log_result("chat", "Chat History", False, "Response is not a list")
            else:
                self.log_result("chat", "Chat History", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("chat", "Chat History", False, str(e))
        return False
    
    def test_chat_get(self):
        """Test getting specific chat"""
        if not self.test_chat_id:
            self.log_result("chat", "Get Chat", False, "No chat_id available")
            return False
        
        try:
            response = self.session.get(f"{self.base_url}/chat/{self.test_chat_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "messages" in data:
                    self.log_result("chat", "Get Chat", True)
                    return True
                else:
                    self.log_result("chat", "Get Chat", False, "Missing id or messages in response")
            else:
                self.log_result("chat", "Get Chat", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("chat", "Get Chat", False, str(e))
        return False
    
    def test_export_chat_pdf(self):
        """Test exporting chat to PDF"""
        if not self.test_chat_id:
            self.log_result("export", "Export Chat PDF", False, "No chat_id available")
            return False
        
        try:
            response = self.session.get(f"{self.base_url}/chat/{self.test_chat_id}/export/pdf")
            
            if response.status_code == 200:
                if response.headers.get('content-type') == 'application/pdf':
                    self.log_result("export", "Export Chat PDF", True)
                    return True
                else:
                    self.log_result("export", "Export Chat PDF", False, "Response is not PDF format")
            else:
                self.log_result("export", "Export Chat PDF", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("export", "Export Chat PDF", False, str(e))
        return False
    
    def test_export_chat_docx(self):
        """Test exporting chat to DOCX"""
        if not self.test_chat_id:
            self.log_result("export", "Export Chat DOCX", False, "No chat_id available")
            return False
        
        try:
            response = self.session.get(f"{self.base_url}/chat/{self.test_chat_id}/export/docx")
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                if 'officedocument.wordprocessingml.document' in content_type:
                    self.log_result("export", "Export Chat DOCX", True)
                    return True
                else:
                    self.log_result("export", "Export Chat DOCX", False, f"Unexpected content type: {content_type}")
            else:
                self.log_result("export", "Export Chat DOCX", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("export", "Export Chat DOCX", False, str(e))
        return False
    
    def test_export_chat_txt(self):
        """Test exporting chat to TXT"""
        if not self.test_chat_id:
            self.log_result("export", "Export Chat TXT", False, "No chat_id available")
            return False
        
        try:
            response = self.session.get(f"{self.base_url}/chat/{self.test_chat_id}/export/txt")
            
            if response.status_code == 200:
                if response.headers.get('content-type') == 'text/plain; charset=utf-8':
                    self.log_result("export", "Export Chat TXT", True)
                    return True
                else:
                    self.log_result("export", "Export Chat TXT", False, "Response is not text format")
            else:
                self.log_result("export", "Export Chat TXT", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("export", "Export Chat TXT", False, str(e))
        return False
    
    def test_export_document_pdf(self):
        """Test exporting document analysis to PDF"""
        if not self.test_document_id:
            self.log_result("export", "Export Document PDF", False, "No document_id available")
            return False
        
        try:
            response = self.session.get(f"{self.base_url}/documents/{self.test_document_id}/export/pdf")
            
            if response.status_code == 200:
                if response.headers.get('content-type') == 'application/pdf':
                    self.log_result("export", "Export Document PDF", True)
                    return True
                else:
                    self.log_result("export", "Export Document PDF", False, "Response is not PDF format")
            else:
                self.log_result("export", "Export Document PDF", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("export", "Export Document PDF", False, str(e))
        return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Pleader AI Backend Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Authentication Tests
        print("\n🔐 AUTHENTICATION TESTS")
        print("-" * 30)
        auth_success = self.test_auth_signup()
        if auth_success:
            self.test_auth_me()
            # Don't logout yet, we need the token for other tests
        
        # Document Tests
        print("\n📄 DOCUMENT TESTS")
        print("-" * 30)
        self.test_document_analyze()
        
        # RAG Tests
        print("\n🧠 RAG TESTS")
        print("-" * 30)
        self.test_rag_query()
        self.test_rag_stats()
        
        # Chat Tests
        print("\n💬 CHAT TESTS")
        print("-" * 30)
        self.test_chat_send()
        self.test_chat_history()
        self.test_chat_get()
        
        # Export Tests
        print("\n📤 EXPORT TESTS")
        print("-" * 30)
        self.test_export_chat_pdf()
        self.test_export_chat_docx()
        self.test_export_chat_txt()
        self.test_export_document_pdf()
        
        # Final logout test
        print("\n🔐 FINAL AUTH TEST")
        print("-" * 30)
        self.test_auth_logout()
        
        # Print Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_passed = 0
        total_failed = 0
        
        for category, results in self.results.items():
            passed = results["passed"]
            failed = results["failed"]
            total_passed += passed
            total_failed += failed
            
            status = "✅" if failed == 0 else "❌"
            print(f"{status} {category.upper()}: {passed} passed, {failed} failed")
            
            if results["errors"]:
                for error in results["errors"]:
                    print(f"   ❌ {error}")
        
        print("-" * 60)
        print(f"🎯 OVERALL: {total_passed} passed, {total_failed} failed")
        
        if total_failed == 0:
            print("🎉 ALL TESTS PASSED!")
        else:
            print(f"⚠️  {total_failed} TESTS FAILED - See errors above")
        
        return total_failed == 0

if __name__ == "__main__":
    tester = PleaderBackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)