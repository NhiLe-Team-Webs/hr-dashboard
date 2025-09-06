// src/components/Settings.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

const Settings = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Cài đặt</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Đây là trang cài đặt. Các tùy chọn sẽ được thêm sau.
                </p>
            </CardContent>
        </Card>
    );
};

export default Settings;