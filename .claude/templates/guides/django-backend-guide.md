# Django REST Framework Backend Development Guide

> This guide is loaded by the `backend-developer` agent when working with Django projects.
> Contains detailed Django-specific patterns, rules, and implementation workflows.
>
> **Source**: Extracted from `agents/backend-developer.md` for context window optimization.

---

# Django REST Framework Instructions

**Use these instructions when the detected stack is Django.**

## Core Responsibilities

### 1. Django Three-Layer Architecture

**Layer 1: Models (Data Models)**
- Create models extending `models.Model`
- Use Django ORM field types (`CharField`, `ForeignKey`, `ManyToManyField`, etc.)
- Define Meta class for ordering, indexes, verbose names
- Add `__str__()` method for representation
- Include custom methods for model logic

**Layer 2: Serializers (Data Serialization)**
- Create serializers extending `serializers.ModelSerializer`
- Define fields and Meta configuration
- Add custom validation methods (`validate_<field>`)
- Implement nested serializers for relationships
- Use `SerializerMethodField` for computed fields

**Layer 3: ViewSets (API Endpoints)**
- Create viewsets extending `ModelViewSet` or `GenericViewSet`
- Use DRF mixins (`ListModelMixin`, `CreateModelMixin`, etc.)
- Add permission classes (`IsAuthenticated`, custom permissions)
- Implement custom actions with `@action` decorator
- Add filtering, pagination, and ordering

### 2. Serializer Creation

**Model Serializers:**
- Extend `serializers.ModelSerializer`
- Specify model and fields in Meta class
- Add validators (`UniqueValidator`, custom validators)
- Use `SerializerMethodField` for computed fields
- Add drf-spectacular decorators (`@extend_schema_field`)

**Request/Response Serializers:**
- Create separate serializers for input and output
- Use `write_only` and `read_only` field options
- Implement `create()` and `update()` methods
- Add nested serializers for relationships

### 3. Database Integration

**Model Design:**
- Reference `.claude/docs/PROJECT_DATABASE.md` for schema
- Follow Django naming conventions (snake_case)
- Implement proper field types and options
- Add indexes with `db_index=True` or Meta indexes
- Include timestamp fields (`DateTimeField(auto_now_add=True)`)

**Migration Management:**
- Generate migrations: `python manage.py makemigrations`
- Review migrations before applying
- Apply migrations: `python manage.py migrate`
- Use data migrations for complex changes

**Query Optimization:**
- Use `select_related()` for foreign keys (1:1, N:1)
- Use `prefetch_related()` for many-to-many and reverse foreign keys
- Add database indexes for frequently queried fields
- Use `only()` and `defer()` for field selection

### 4. Authentication & Authorization

**JWT Implementation:**
- Use `djangorestframework-simplejwt`
- Configure token settings in settings.py
- Create login/register views
- Add `JWTAuthentication` to REST_FRAMEWORK settings
- Implement refresh token mechanism

**Permissions:**
- Use built-in permissions (`IsAuthenticated`, `IsAdminUser`)
- Create custom permission classes extending `BasePermission`
- Implement `has_permission()` and `has_object_permission()`
- Add permissions to viewsets with `permission_classes`

### 5. API Documentation

**drf-spectacular Integration:**
- Add `@extend_schema` decorator to viewsets and actions
- Document request/response with serializers
- Add examples using `OpenApiExample`
- Include operation descriptions and summaries
- Document authentication requirements

**Documentation Best Practices:**
- Document all endpoints comprehensively
- Include request/response examples
- Document error responses
- Add authentication requirements
- Keep OpenAPI schema up to date

### 6. Error Handling

**Django Exceptions:**
- Raise DRF exceptions (`ValidationError`, `NotFound`, `PermissionDenied`)
- Create custom exception handler if needed
- Return consistent error response format
- Include meaningful error messages
- Add error codes for client handling

## Quality Standards

### Code Quality
- All code must have proper Python type hints
- Use Django best practices and conventions
- Follow PEP 8 style guide
- Extract magic strings to constants/settings
- Add docstrings for complex logic

### Architecture
- Follow Django three-layer pattern
- Models → Serializers → ViewSets
- No business logic in views
- Serializers handle validation
- Use Django signals for cross-cutting concerns

### API Design
- Use proper HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Return proper HTTP status codes
- Implement consistent response format
- Add pagination for list endpoints
- Use DRF serializers for all data

### Security
- Validate all input with serializers
- Sanitize user input
- Use DRF permissions for authorization
- Never expose sensitive data
- Implement rate limiting when needed
- Use environment variables for secrets

### Performance
- Add database indexes for frequently queried fields
- Use `select_related()`/`prefetch_related()` appropriately
- Implement pagination for large datasets
- Cache frequently accessed data when appropriate
- Optimize N+1 query problems

## Workflow

### API Module Implementation Workflow

0. **Dependency Update Phase:**
   - Update Python dependencies:
     ```bash
     pip install --upgrade -r requirements.txt
     ```
   - Or if using Poetry:
     ```bash
     poetry update
     ```
   - Review changelog for breaking changes

1. **Planning Phase:**
   - Review requirements from tickets or PROJECT_API.md
   - Check PROJECT_DATABASE.md for model structure
   - Identify relationships with other apps
   - Plan serializer structure and validation rules

2. **Database Layer (Model):**
   - Create model in `<app>/models.py`
   - Define fields with Django ORM field types
   - Add Meta class (ordering, indexes, verbose_name)
   - Implement `__str__()` method
   - Add custom model methods if needed

3. **Serialization Layer (Serializers):**
   - Create serializers in `<app>/serializers.py`
   - Extend `ModelSerializer` for model serializers
   - Define fields in Meta class
   - Add custom validation methods
   - Implement nested serializers for relationships

4. **API Layer (ViewSets):**
   - Create viewsets in `<app>/views.py` or `<app>/viewsets.py`
   - Extend appropriate ViewSet class
   - Define queryset and serializer_class
   - Add permission_classes
   - Implement custom actions with `@action`
   - Add `@extend_schema` decorators

5. **URL Configuration:**
   - Register viewset with router in `<app>/urls.py`
   - Or define explicit URL patterns
   - Include app URLs in project urls.py

6. **Migration:**
   - Generate migration: `python manage.py makemigrations`
   - Review generated migration
   - Apply migration: `python manage.py migrate`
   - Test rollback if needed

7. **Testing & Verification:**
   - Test endpoints with Django REST Framework browsable API
   - Verify database operations
   - Check error handling
   - Test authentication/authorization
   - Update API_IMPLEMENTATION_STATUS.md

8. **Build & Runtime Verification:**
   - Check for Python errors:
     ```bash
     python manage.py check
     ```
   - Fix any issues found
   - Run migrations if needed:
     ```bash
     python manage.py migrate
     ```
   - Verify runtime startup:
     ```bash
     python manage.py runserver
     ```
   - Check console for errors during startup
   - Test API endpoint or health check
   - Stop the development server after verification:
     ```bash
     # Press Ctrl+C
     ```

### Endpoint Implementation Workflow

1. **Analyze Requirements:**
   - Check PROJECT_API.md for endpoint spec
   - Identify required serializers
   - Determine business logic needed
   - Plan database queries

2. **Create/Update Serializer:**
   - Create serializer if needed
   - Add validation logic
   - Implement custom fields
   - Add drf-spectacular decorators

3. **Implement ViewSet Method/Action:**
   - Add method or `@action` to viewset
   - Implement business logic
   - Handle errors with DRF exceptions
   - Add `@extend_schema` documentation

4. **Test & Document:**
   - Test endpoint with various inputs
   - Verify error handling
   - Update status tracking
   - Note any implementation details

## Output Format

When completing tasks, provide:

1. **Files Created/Modified:** List all models, serializers, viewsets, URLs
2. **App Structure:** Show the Django app structure
3. **API Endpoints:** List all endpoints with methods and paths
4. **Database Changes:** Document models and migrations created
5. **Status Updates:** Confirm API_IMPLEMENTATION_STATUS.md updated
6. **Next Steps:** Suggest follow-up work (testing, optimization)

## Important Notes

- **Always follow Django three-layer architecture:** Models → Serializers → ViewSets
- **Use Django ORM:** Leverage queryset methods and annotations
- **Serializer validation:** Use serializers for all input validation
- **drf-spectacular documentation:** Complete docs for all endpoints
- **Error handling:** Raise proper DRF exceptions
- **Type hints:** All code must have proper type annotations
- **Migrations:** Always generate and test migrations
- **Testing readiness:** Write code that's easy to unit test
