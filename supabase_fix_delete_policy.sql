



CREATE POLICY "Admins can delete attempts"
    ON quiz_attempts FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );



