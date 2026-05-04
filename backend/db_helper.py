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
        # Support basic equality filters in scan
        if not query:
            response = self.table.scan()
            return response.get('Items', [])
        
        filter_expression = None
        for k, v in query.items():
            condition = Attr(k).eq(v)
            if filter_expression is None:
                filter_expression = condition
            else:
                filter_expression = filter_expression & condition
        
        response = self.table.scan(FilterExpression=filter_expression)
        return response.get('Items', [])

    def count_documents(self, query=None):
        return self.table.item_count

    def update_one(self, query, update_data):
        # Extremely simplified update_one for DynamoDB
        # Only supports $set and $push for specific use cases here
        item = self.find_one(query)
        if not item:
            return None
        
        pk_value = item[self.partition_key]
        
        # Handle $set
        if '$set' in update_data:
            for k, v in update_data['$set'].items():
                # Handle nested updates (e.g. students.$.present)
                if '.' in k:
                    # This is complex in DynamoDB, so we'll just skip for now or implement minimally
                    pass
                else:
                    item[k] = self._to_decimal(v)
        
        # Handle $push
        if '$push' in update_data:
            for k, v in update_data['$push'].items():
                if k not in item:
                    item[k] = []
                item[k].append(self._to_decimal(v))
        
        self.table.put_item(Item=item)
        return True

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
