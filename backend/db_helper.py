import boto3
from boto3.dynamodb.conditions import Key, Attr
import time
import uuid
from decimal import Decimal
import numpy as np

class DynamoDBCollection:
    def __init__(self, table_name, partition_key='id'):
        self.dynamodb = boto3.resource('dynamodb', region_name='eu-north-1') # Adjust region as needed
        self.table = self.dynamodb.Table(table_name)
        self.partition_key = partition_key

    def _to_decimal(self, obj):
        if isinstance(obj, float):
            return Decimal(str(obj))
        if isinstance(obj, list):
            return [self._to_decimal(i) for i in obj]
        if isinstance(obj, dict):
            return {k: self._to_decimal(v) for k, v in obj.items()}
        return obj

    def insert_one(self, data):
        data = self._to_decimal(data)
        if self.partition_key not in data:
            data[self.partition_key] = str(uuid.uuid4())
        self.table.put_item(Item=data)
        class Result:
            def __init__(self, id):
                self.inserted_id = id
        return Result(data[self.partition_key])

    def find_one(self, query):
        # Very simple query support for DynamoDB (only supports partition key or single attribute filter)
        if not query:
            return None
        
        # If querying by partition key
        if self.partition_key in query:
            response = self.table.get_item(Key={self.partition_key: query[self.partition_key]})
            return response.get('Item')
        
        # Otherwise scan (inefficient but works for small tables)
        attr_name = list(query.keys())[0]
        attr_value = query[attr_name]
        response = self.table.scan(FilterExpression=Attr(attr_name).eq(attr_value))
        items = response.get('Items', [])
        return items[0] if items else None

    def find(self, query=None):
        # Returns all items for now, ignoring query for simplicity
        response = self.table.scan()
        return response.get('Items', [])

    def count_documents(self, query=None):
        return self.table.item_count

    def distinct(self, field):
        response = self.table.scan(ProjectionExpression=field)
        items = response.get('Items', [])
        return list(set([item.get(field) for item in items if item.get(field)]))

class DynamoDBWrapper:
    def __init__(self):
        self.students = DynamoDBCollection('Attendance_Students', partition_key='email')
        self.auth_users = DynamoDBCollection('Attendance_Users', partition_key='email')
        self.auth_teachers = DynamoDBCollection('Attendance_Teachers', partition_key='email')
        self.attendance_records = DynamoDBCollection('Attendance_Record', partition_key='record_id')
