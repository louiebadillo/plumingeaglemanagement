import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormLabel,
  FormGroup,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { FIELD_TYPES } from '../../config/formTemplates';

// Individual field renderer components
const ScaleField = ({ field, value, onChange, error }) => (
  <Box>
    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
      {field.description}
    </Typography>
    <TextField
      type="number"
      value={value || field.defaultValue || ''}
      onChange={(e) => onChange(field.key, parseInt(e.target.value))}
      error={!!error}
      helperText={error || `${field.min} = Poor, ${field.max} = Excellent`}
      inputProps={{ min: field.min, max: field.max }}
      fullWidth
      variant="outlined"
    />
  </Box>
);

const TextField = ({ field, value, onChange, error }) => (
  <TextField
    label={field.label}
    value={value || ''}
    onChange={(e) => onChange(field.key, e.target.value)}
    error={!!error}
    helperText={error || field.description}
    placeholder={field.placeholder}
    fullWidth
    variant="outlined"
    type={field.type === FIELD_TYPES.EMAIL ? 'email' : 
          field.type === FIELD_TYPES.PHONE ? 'tel' : 
          field.type === FIELD_TYPES.NUMBER ? 'number' : 'text'}
  />
);

const TextAreaField = ({ field, value, onChange, error }) => (
  <TextField
    label={field.label}
    value={value || ''}
    onChange={(e) => onChange(field.key, e.target.value)}
    error={!!error}
    helperText={error || field.description}
    placeholder={field.placeholder}
    fullWidth
    multiline
    rows={4}
    variant="outlined"
  />
);

const YesNoField = ({ field, value, onChange, error }) => (
  <Box>
    <FormLabel component="legend" sx={{ mb: 1 }}>
      {field.label}
    </FormLabel>
    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
      {field.description}
    </Typography>
    <RadioGroup
      value={value !== undefined ? value.toString() : ''}
      onChange={(e) => onChange(field.key, e.target.value === 'true')}
      row
    >
      <FormControlLabel value="true" control={<Radio />} label="Yes" />
      <FormControlLabel value="false" control={<Radio />} label="No" />
    </RadioGroup>
    {error && (
      <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
        {error}
      </Typography>
    )}
  </Box>
);

const SelectField = ({ field, value, onChange, error }) => (
  <FormControl fullWidth error={!!error}>
    <InputLabel>{field.label}</InputLabel>
    <Select
      value={value || ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      label={field.label}
    >
      {field.options?.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
    {error && (
      <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
        {error}
      </Typography>
    )}
    {field.description && !error && (
      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
        {field.description}
      </Typography>
    )}
  </FormControl>
);

const MultiSelectField = ({ field, value, onChange, error }) => {
  const handleChange = (optionValue) => {
    const currentValues = value || [];
    const newValues = currentValues.includes(optionValue)
      ? currentValues.filter(v => v !== optionValue)
      : [...currentValues, optionValue];
    onChange(field.key, newValues);
  };

  return (
    <Box>
      <FormLabel component="legend" sx={{ mb: 1 }}>
        {field.label}
      </FormLabel>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        {field.description}
      </Typography>
      <FormGroup>
        {field.options?.map((option) => (
          <FormControlLabel
            key={option.value}
            control={
              <Checkbox
                checked={(value || []).includes(option.value)}
                onChange={() => handleChange(option.value)}
              />
            }
            label={option.label}
          />
        ))}
      </FormGroup>
      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

const CheckboxField = ({ field, value, onChange, error }) => (
  <FormControlLabel
    control={
      <Checkbox
        checked={value || false}
        onChange={(e) => onChange(field.key, e.target.checked)}
      />
    }
    label={
      <Box>
        <Typography variant="body2">{field.label}</Typography>
        {field.description && (
          <Typography variant="caption" color="textSecondary">
            {field.description}
          </Typography>
        )}
      </Box>
    }
  />
);

const DateField = ({ field, value, onChange, error }) => (
  <LocalizationProvider dateAdapter={AdapterDateFns}>
    <DatePicker
      label={field.label}
      value={value ? new Date(value) : null}
      onChange={(date) => onChange(field.key, date ? date.toISOString().split('T')[0] : '')}
      renderInput={(params) => (
        <TextField
          {...params}
          fullWidth
          error={!!error}
          helperText={error || field.description}
        />
      )}
    />
  </LocalizationProvider>
);

const TimeField = ({ field, value, onChange, error }) => (
  <LocalizationProvider dateAdapter={AdapterDateFns}>
    <TimePicker
      label={field.label}
      value={value ? new Date(`2000-01-01T${value}`) : null}
      onChange={(time) => onChange(field.key, time ? time.toTimeString().slice(0, 5) : '')}
      renderInput={(params) => (
        <TextField
          {...params}
          fullWidth
          error={!!error}
          helperText={error || field.description}
        />
      )}
    />
  </LocalizationProvider>
);

const FileField = ({ field, value, onChange, error }) => (
  <Box>
    <Typography variant="body2" sx={{ mb: 1 }}>
      {field.label}
    </Typography>
    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
      {field.description}
    </Typography>
    <input
      type="file"
      accept={field.accept || '*'}
      onChange={(e) => onChange(field.key, e.target.files[0])}
      style={{ width: '100%' }}
    />
    {error && (
      <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
        {error}
      </Typography>
    )}
  </Box>
);

// Main form renderer component
const FormRenderer = ({ 
  template, 
  data = {}, 
  onChange, 
  errors = {},
  showCategories = true 
}) => {
  const fieldsByCategory = template.categories ? 
    Object.entries(template.categories)
      .sort(([,a], [,b]) => a.order - b.order)
      .map(([categoryKey, category]) => ({
        ...category,
        key: categoryKey,
        fields: Object.entries(template.fields)
          .filter(([, field]) => field.category === categoryKey)
          .map(([fieldKey, field]) => ({ key: fieldKey, ...field }))
      })) :
    [{ 
      key: 'default', 
      label: 'Form Fields', 
      fields: Object.entries(template.fields).map(([fieldKey, field]) => ({ key: fieldKey, ...field }))
    }];

  const renderField = (field) => {
    const fieldError = errors[field.key];
    
    switch (field.type) {
      case FIELD_TYPES.SCALE:
        return <ScaleField field={field} value={data[field.key]} onChange={onChange} error={fieldError} />;
      case FIELD_TYPES.TEXT:
      case FIELD_TYPES.EMAIL:
      case FIELD_TYPES.PHONE:
      case FIELD_TYPES.NUMBER:
        return <TextField field={field} value={data[field.key]} onChange={onChange} error={fieldError} />;
      case FIELD_TYPES.TEXTAREA:
        return <TextAreaField field={field} value={data[field.key]} onChange={onChange} error={fieldError} />;
      case FIELD_TYPES.YES_NO:
        return <YesNoField field={field} value={data[field.key]} onChange={onChange} error={fieldError} />;
      case FIELD_TYPES.SELECT:
        return <SelectField field={field} value={data[field.key]} onChange={onChange} error={fieldError} />;
      case FIELD_TYPES.MULTI_SELECT:
        return <MultiSelectField field={field} value={data[field.key]} onChange={onChange} error={fieldError} />;
      case FIELD_TYPES.CHECKBOX:
        return <CheckboxField field={field} value={data[field.key]} onChange={onChange} error={fieldError} />;
      case FIELD_TYPES.DATE:
        return <DateField field={field} value={data[field.key]} onChange={onChange} error={fieldError} />;
      case FIELD_TYPES.TIME:
        return <TimeField field={field} value={data[field.key]} onChange={onChange} error={fieldError} />;
      case FIELD_TYPES.FILE:
        return <FileField field={field} value={data[field.key]} onChange={onChange} error={fieldError} />;
      default:
        return (
          <Typography color="error">
            Unknown field type: {field.type}
          </Typography>
        );
    }
  };

  return (
    <Box>
      {showCategories ? (
        fieldsByCategory.map((category) => (
          <Card key={category.key} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {category.label}
              </Typography>
              {category.description && (
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {category.description}
                </Typography>
              )}
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={3}>
                {category.fields.map((field) => (
                  <Grid item xs={12} sm={6} md={4} key={field.key}>
                    {renderField(field)}
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        ))
      ) : (
        <Grid container spacing={3}>
          {Object.entries(template.fields).map(([fieldKey, field]) => (
            <Grid item xs={12} sm={6} md={4} key={fieldKey}>
              {renderField({ key: fieldKey, ...field })}
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default FormRenderer;
